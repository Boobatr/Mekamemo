import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PgBoss } from 'pg-boss';

/**
 * Postgres-backed job queue (no Redis/Docker needed — it lives in the same
 * database). Handles the two recurring notification jobs: the monthly
 * mileage prompt and the periodic dispatch of due reminders.
 *
 * pg-boss ships as a pure ESM package, so it's loaded via a dynamic import
 * instead of a static one — a static import would compile to a `require()`
 * that Node's CJS loader can't resolve against an ESM-only package.
 */
@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossService.name);
  private _boss: PgBoss | null = null;

  constructor(private readonly config: ConfigService) {}

  get boss(): PgBoss {
    if (!this._boss) throw new Error('PgBoss has not started yet.');
    return this._boss;
  }

  async onModuleInit() {
    const { PgBoss } = await import('pg-boss');
    const connectionString = this.config.get<string>('DATABASE_URL');
    this._boss = new PgBoss({ connectionString });
    this._boss.on('error', (err) => this.logger.error('pg-boss error', err));
    await this._boss.start();
  }

  async onModuleDestroy() {
    if (this._boss) await this._boss.stop({ graceful: false, close: true });
  }
}
