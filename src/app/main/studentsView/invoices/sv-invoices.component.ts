import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';


@Component({
    templateUrl: './sv-invoices.component.html',
    animations: [appModuleAnimation()]
})
export class SVInvoicesComponent extends AppComponentBase  {

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

}
