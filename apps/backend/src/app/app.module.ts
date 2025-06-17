import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { BoardsModule } from './boards/boards.module';
import { ActivitiesModule } from './activities/activities.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TagsModule } from './tags/tags.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ClassesModule,
    BoardsModule,
    ActivitiesModule,
    AssignmentsModule,
    TagsModule,
    WebsocketsModule,
    AnalyticsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
