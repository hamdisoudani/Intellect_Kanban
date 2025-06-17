import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ClassesModule } from '../classes/classes.module';
import { ActivitiesModule } from '../activities/activities.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { TagsModule } from '../tags/tags.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ClassesModule,
    ActivitiesModule,
    AssignmentsModule,
    TagsModule,
    UsersModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {} 