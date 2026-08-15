import { Global, Module } from '@nestjs/common';
import { anthropicClientProvider } from './anthropic-client.provider';

@Global()
@Module({
  providers: [anthropicClientProvider],
  exports: [anthropicClientProvider],
})
export class AiModule {}
