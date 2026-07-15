import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeRegistryService } from './realtime-registry.service';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, RealtimeRegistryService],
  exports: [RealtimeGateway, RealtimeRegistryService],
})
export class RealtimeModule {}
