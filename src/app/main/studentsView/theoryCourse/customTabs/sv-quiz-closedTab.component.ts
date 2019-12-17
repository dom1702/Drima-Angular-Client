import { Component, ViewEncapsulation } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";

@Component({
    templateUrl: './sv-quiz-closedTab.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    selector: 'closedTab'
})

export class SVQuizClosedTabComponent {


}