﻿import { Component, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnrollmentsServiceProxy, EnrollmentDto  } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditEnrollmentModalComponent } from './create-or-edit-enrollment-modal.component';
import { ViewEnrollmentModalComponent } from './view-enrollment-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/components/table/table';
import { Paginator } from 'primeng/components/paginator/paginator';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
    templateUrl: './enrollments.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class EnrollmentsComponent extends AppComponentBase {

    @ViewChild('createOrEditEnrollmentModal') createOrEditEnrollmentModal: CreateOrEditEnrollmentModalComponent;
    @ViewChild('viewEnrollmentModalComponent') viewEnrollmentModal: ViewEnrollmentModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    advancedFiltersAreShown = false;
    filterText = '';
    firstNameFilter = '';
    lastNameFilter = '';
    socialSecurityNoFilter = '';
    payersSocialSecurityNoFilter = '';
    payersNameFilter = '';
    licenseClassFilter = '';
    approvedFilter = -1;
    maxEnrollmentDateFilter : moment.Moment;
		minEnrollmentDateFilter : moment.Moment;
        courseNameFilter = '';
        officeNameFilter = '';




    constructor(
        injector: Injector,
        private _enrollmentsServiceProxy: EnrollmentsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }

    getEnrollments(event?: LazyLoadEvent) {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        this._enrollmentsServiceProxy.getAll(
            this.filterText,
            this.firstNameFilter,
            this.lastNameFilter,
            this.socialSecurityNoFilter,
            this.payersSocialSecurityNoFilter,
            this.payersNameFilter,
            this.licenseClassFilter,
            this.approvedFilter,
            this.maxEnrollmentDateFilter,
            this.minEnrollmentDateFilter,
            this.courseNameFilter,
            this.officeNameFilter,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getMaxResultCount(this.paginator, event)
        ).subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    createEnrollment(): void {
        this.createOrEditEnrollmentModal.show();
    }

    deleteEnrollment(enrollment: EnrollmentDto): void {
        this.message.confirm(
            '',
            this.l('AreYouSure'),
            (isConfirmed) => {
                if (isConfirmed) {
                    this._enrollmentsServiceProxy.delete(enrollment.id)
                        .subscribe(() => {
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    exportToExcel(): void {
        this._enrollmentsServiceProxy.getEnrollmentsToExcel(
        this.filterText,
            this.firstNameFilter,
            this.lastNameFilter,
            this.socialSecurityNoFilter,
            this.payersSocialSecurityNoFilter,
            this.payersNameFilter,
            this.licenseClassFilter,
            this.approvedFilter,
            this.maxEnrollmentDateFilter,
            this.minEnrollmentDateFilter,
            this.courseNameFilter,
            this.officeNameFilter,
        )
        .subscribe(result => {
            this._fileDownloadService.downloadTempFile(result);
         });
    }
}