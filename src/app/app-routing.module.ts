import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoCallComponent } from './video-call/video-call.component';

const routes: Routes = [
  {
    path: '', redirectTo: 'video', pathMatch: 'full'
  },
  {
    path: 'video', component: VideoCallComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
