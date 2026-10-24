import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EMAIL_PROVIDER } from '../src/quotes/email-provider.interface';
import type { EmailMessage } from '../src/quotes/email-provider.interface';

describe('Forgot password (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sent: EmailMessage[] = [];
  const run = `reset${Date.now()}`;
  let counter = 0;
  const oldPassword = 'ancienmotdepasse1';
  const newPassword = 'nouveaumotdepasse2';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_PROVIDER)
      .useValue({ send: async (message: EmailMessage) => void sent.push(message) })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: run } } });
    await app.close();
  });

  beforeEach(() => {
    sent.length = 0;
  });

  const http = () => request(app.getHttpServer());

  async function newUser(language: 'fr' | 'en' = 'fr') {
    const email = `${run}.${counter++}@courriel.ca`;
    await http()
      .post('/auth/register')
      .send({ email, password: oldPassword, fullName: 'Marc Lavoie', phone: '+1 514 555 0142', postalCode: 'H2X 1Y4', searchRadiusKm: 15, language })
      .expect(201);
    return email;
  }

  const requestCode = async (email: string) => {
    await http().post('/auth/forgot-password').send({ email }).expect(200, { ok: true });
    const mail = sent.at(-1);
    return mail?.body.match(/[A-Z2-9]{4}-[A-Z2-9]{4}/)?.[0];
  };

  const reset = (email: string, code: string, password = newPassword) =>
    http().post('/auth/reset-password').send({ email, code, newPassword: password });

  const login = (email: string, password: string) => http().post('/auth/login').send({ email, password });

  it('answers the same way for an address nobody registered, and sends nothing', async () => {
    await http().post('/auth/forgot-password').send({ email: `${run}.nobody@courriel.ca` }).expect(200, { ok: true });

    expect(sent).toHaveLength(0);
  });

  it('e-mails a code in the user language, and stores only its hash', async () => {
    const email = await newUser('en');

    const code = await requestCode(email);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: email, subject: 'Your MekaMemo password reset code' });
    expect(code).toBeDefined();
    const tokens = await prisma.passwordResetToken.findMany({ where: { user: { email } } });
    expect(tokens).toHaveLength(1);
    expect(tokens[0].codeHash).not.toContain(code!.replace('-', ''));
  });

  it('resets the password with the e-mailed code, signs the user in, and the code works once', async () => {
    const email = await newUser();
    const code = (await requestCode(email))!;

    const res = await reset(email, code).expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    await login(email, newPassword).expect(200);
    await login(email, oldPassword).expect(401);
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).hasChosenPassword).toBe(true);
    await reset(email, code, 'encoreunautre3').expect(400); // already used
  });

  it('accepts the code in lower case, with a space, and an e-mail typed in other letters', async () => {
    const email = await newUser();
    const code = (await requestCode(email))!;

    await reset(email.toUpperCase(), code.toLowerCase().replace('-', ' ')).expect(200);

    await login(email, newPassword).expect(200);
  });

  it('refuses a wrong code and locks the code after five wrong guesses', async () => {
    const email = await newUser();
    const code = (await requestCode(email))!;

    for (let guess = 0; guess < 5; guess++) {
      const refused = await reset(email, 'ZZZZ-ZZZZ').expect(400);
      expect(refused.body.message).toBe('Code invalide ou expiré.');
    }
    await reset(email, code).expect(400); // even the right one: a new code is needed
    await login(email, oldPassword).expect(200); // password untouched

    const fresh = (await requestCode(email))!;
    await reset(email, fresh).expect(200);
  });

  it('refuses an expired code', async () => {
    const email = await newUser();
    const code = (await requestCode(email))!;
    await prisma.passwordResetToken.updateMany({
      where: { user: { email } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await reset(email, code).expect(400);
    await login(email, oldPassword).expect(200);
  });

  it('only honours the newest code', async () => {
    const email = await newUser();
    const first = (await requestCode(email))!;
    const second = (await requestCode(email))!;

    await reset(email, first).expect(400);
    await reset(email, second).expect(200);
  });

  it('gives no hint about unknown accounts when resetting', async () => {
    const refused = await reset(`${run}.nobody@courriel.ca`, 'ABCD-EFGH').expect(400);
    expect(refused.body.message).toBe('Code invalide ou expiré.');
  });

  it('limits how many codes one account can request per hour', async () => {
    const email = await newUser();

    for (let i = 0; i < 3; i++) await requestCode(email);
    sent.length = 0;
    await http().post('/auth/forgot-password').send({ email }).expect(200, { ok: true }); // same answer

    expect(sent).toHaveLength(0);
  });

  it('rejects malformed input before doing anything', async () => {
    await http().post('/auth/forgot-password').send({ email: 'not-an-email' }).expect(400);
    await reset('marc@courriel.ca', 'ABCD-EFGH', 'court').expect(400);
    await http().post('/auth/reset-password').send({ email: 'marc@courriel.ca', newPassword }).expect(400);
  });
});
