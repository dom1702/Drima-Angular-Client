import { Component, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { StudentsServiceProxy, StudentDto  } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { StudentsOverviewPricePackageComponent } from './students-overview-pricePackage.component';

@Component({
    templateUrl: './students-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class StudentsOverviewComponent extends AppComponentBase {

    @ViewChild(StudentsOverviewPricePackageComponent) pricePackageView: StudentsOverviewPricePackageComponent;

    subscription : Subscription;

    overallActive : boolean = false;
    overviewTabName : string = this.l("Overview");
    pricePackageTabName : string = this.l("PricePackage");
    studentInvoicesTabName : string = this.l("StudentInvoices");
    studentFormsTabName : string = this.l("StudentForms");

    student : StudentDto;
    pricePackageName : string;

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService,
        private location: Location
    ) {
        super(injector);
    }

    ngOnInit(): void {
      
        this.subscription = this._activatedRoute.params.subscribe(params => {
            
            const id = params['id'] || '';

            this._studentsServiceProxy.getStudentForView(id).subscribe(result => {
                
                this.student = result.student;

                this.pricePackageName = result.pricePackageName;

                this.overallActive = true;
            });
        });
    }

    public UpdateStudentView() {

        this._studentsServiceProxy.getStudentForView(this.student.id).subscribe(result => {
        
            this.student = result.student;
            this.pricePackageName = result.pricePackageName;

            console.log(this.pricePackageView);
            this.pricePackageView.updatePricePackage(result.student.pricePackageId);
        });
    }

    goBack()
    {
        this.location.back();
    }
}
