import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'chat', loadChildren: () => import('./pages/chat/chat').then(m => m.ChatComponent) },
  { path: 'chat/scripts', loadChildren: () => import('./pages/chat/chat-scripts/chat-scripts').then(m => m.ChatScriptsComponent) },
  { path: 'chat/settings', loadChildren: () => import('./pages/chat/chat-settings/chat-settings').then(m => m.ChatSettingsComponent) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
