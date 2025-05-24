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

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ClassesModule,
    BoardsModule,
    ActivitiesModule,
    AssignmentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
