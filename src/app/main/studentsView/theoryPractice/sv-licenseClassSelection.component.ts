import { Component, Injector, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';


@Component({
    templateUrl: './sv-licenseClassSelection.component.html',
    animations: [appModuleAnimation()]
})
export class SVLicenseClassSelection extends AppComponentBase {

    constructor(
        injector: Injector,       
    ) {
        super(injector);
    }
}