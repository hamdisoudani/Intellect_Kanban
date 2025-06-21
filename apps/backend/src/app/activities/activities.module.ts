import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Board, BoardSchema } from '../boards/schemas/board.schema';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { TagsModule } from '../tags/tags.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Board.name, schema: BoardSchema }
    ]),
    UsersModule,
    ClassesModule,
    AssignmentsModule,
    TagsModule,
    WebsocketsModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {} 