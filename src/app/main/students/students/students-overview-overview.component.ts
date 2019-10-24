import { Component, Injector, ViewEncapsulation, ViewChild, Input } from '@angular/core';
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
import { CreateOrEditStudentModalComponent } from './create-or-edit-student-modal.component';
import { StudentsOverviewComponent } from './students-overview.component';
import { StudentsOverviewPricePackageComponent } from './students-overview-pricePackage.component';
import { CreateOrEditStudentUserModalComponent } from './create-or-edit-student-user-modal.component';

@Component({
    selector: 'students-overview-overview',
    templateUrl: './students-overview-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class StudentsOverviewOverviewComponent extends AppComponentBase {

    @ViewChild('createOrEditStudentModal') createOrEditStudentModal: CreateOrEditStudentModalComponent;
    @ViewChild('createOrEditStudentUserModal') createOrEditStudentUserModal: CreateOrEditStudentUserModalComponent;
    
    @Input() student : StudentDto;
    @Input() pricePackageName : string;
    @Input() parentOverview : StudentsOverviewComponent;

    licenseClasses = 'None';
    licenseClassesAlreadyOwned = 'None';

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }

    ngOnInit(): void {

        this.updateLicenseClass();
        this.updateLicenseClassesAlreadyOwned();
    }

    updateLicenseClass() : void 
    {
        if(this.student.licenseClasses == null)
            return;

        for(var i = 0; i < this.student.licenseClasses.length; i++)
        {
            if(i == 0)
                this.licenseClasses = this.student.licenseClasses[i];
            else
                this.licenseClasses += ', ' + this.student.licenseClasses[i];
        }
    }

    updateLicenseClassesAlreadyOwned() : void 
    {
        if(this.student.licenseClassesAlreadyOwned == null)
            return;

        for(var i = 0; i < this.student.licenseClassesAlreadyOwned.length; i++)
        {
            if(i == 0)
                this.licenseClassesAlreadyOwned = this.student.licenseClassesAlreadyOwned[i];
            else
                this.licenseClassesAlreadyOwned += ', ' + this.student.licenseClassesAlreadyOwned[i];
        }
    }

    updateStudent()
    {
        this.parentOverview.UpdateStudentView();
        this.updateLicenseClass();
        this.updateLicenseClassesAlreadyOwned();
    }

    editStudent(): void {
        this.createOrEditStudentModal.show(this.student.id);
    }

    createUserAccount(): void {
        this.createOrEditStudentUserModal.show(this.student.lastName, this.student.firstName, this.student.email, this.student);
    }
}
