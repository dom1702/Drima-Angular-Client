import { AppComponentBase } from "@shared/common/app-component-base";
import { Injector, Component, ViewEncapsulation } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";

@Component({
    templateUrl: './sv-drivingLessons-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class SVDrivingLessonsOverviewComponent extends AppComponentBase{

    constructor(injector: Injector) {

        super(injector);
    }
}