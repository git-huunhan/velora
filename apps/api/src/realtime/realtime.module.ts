import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeRegistryService } from './realtime-registry.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [RealtimeGateway, RealtimeRegistryService],
  exports: [RealtimeGateway, RealtimeRegistryService],
})
export class RealtimeModule {}
