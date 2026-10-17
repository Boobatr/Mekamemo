-- Accounts that already exist were created with a locally generated, never-shown password.
ALTER TABLE "users" ADD COLUMN "hasChosenPassword" BOOLEAN NOT NULL DEFAULT false;

-- From now on a password supplied at registration is one the user picked.
ALTER TABLE "users" ALTER COLUMN "hasChosenPassword" SET DEFAULT true;
