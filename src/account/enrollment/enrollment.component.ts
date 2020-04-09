import { Component, OnInit, Injector, ViewChild } from "@angular/core";
import { accountModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { TabsetComponent } from "ngx-bootstrap";

@Component({
    selector: 'enrollment',
    templateUrl: './enrollment.component.html',
    styleUrls: ['./enrollment.component.less'],
    animations: [accountModuleAnimation()]
})
export class EnrollmentComponent extends AppComponentBase implements OnInit {

    @ViewChild('staticTabs') staticTabs: TabsetComponent;

    licenseClasses : any[] = [];

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.disableAllTabs();

        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
        this.licenseClasses.push("test");
    }

    disableAllTabs()
    {
        for(let tab of this.staticTabs.tabs)
            tab.disabled = true;
    }

    enableTab(tabNumber : number)
    {
        this.staticTabs.tabs[tabNumber].disabled = false;
    }
}