import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateRoomComponent } from './pages/create-room/create-room.component';
import { EnterRoomComponent } from './pages/enter-room/enter-room.component';
import { RoomComponent } from './pages/room/room.component';
import { HomeComponent } from './home/home.component';
import { TwoWayComponent } from './two-way/two-way.component';
import { VideoChatComponent } from './video-chat/video-chat.component';

const routes: Routes = [
  // { path: '', redirectTo: 'home', pathMatch: 'full' },
  // {
  //   path: 'home',
  //   component: HomeComponent
  // },
  {
    path: 'create-room',
    component: CreateRoomComponent
  },
  {
    path: 'enter-room',
    component: EnterRoomComponent
  },
  {
    path: 'room/:id',
    component: RoomComponent
  },
  {
    path: 'two-way',
    component: TwoWayComponent
  },
  {
    path: 'video-chat',
    component: VideoChatComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
