import { Component, ViewEncapsulation, ViewChild, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";

@Component({
    templateUrl: './sv-theory-course.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class SVTheoryCourseComponent extends AppComponentBase {

    constructor(
        injector: Injector       
    ) {
        super(injector);
    }

    createQuiz() : void {


    }
}