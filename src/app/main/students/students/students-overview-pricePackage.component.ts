import { Component, Injector, ViewEncapsulation, ViewChild, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { StudentsServiceProxy, StudentDto, PricePackagesServiceProxy, PricePackageDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { PricePackageLookupTableModalComponent } from './pricePackage-lookup-table-modal.component';
import { TableModule } from 'primeng/table';
import { CreateOrEditPricePackageModalComponent } from '@app/shared/common/sales/pricePackages/create-or-edit-pricePackage-modal.component';

@Component({
    selector: 'students-overview-pricePackage',
    templateUrl: './students-overview-pricePackage.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class StudentsOverviewPricePackageComponent extends AppComponentBase {

    @ViewChild('pricePackageLookupTableModal') pricePackageLookupTableModal: PricePackageLookupTableModalComponent;
    // This component is shared between this class and the price package admin part, maybe moving it into a shared folder?
    @ViewChild('createOrEditPricePackageModal') createOrEditPricePackageModal: CreateOrEditPricePackageModalComponent;

    @Input() student: StudentDto;

    pricePackage: PricePackageDto;

    pricePackageName: string = 'None';

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService,
        private _pricePackageServiceProxy: PricePackagesServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (this.student.pricePackageId != null) {
            this._pricePackageServiceProxy.getPricePackageForView(this.student.pricePackageId).subscribe(result => {

                this.pricePackage = result.pricePackage;
                this.pricePackageName = result.pricePackage.name;
            });
        }
    }

    updatePricePackage(pricePackageId?: number) {
        if (pricePackageId != null) {
            this._pricePackageServiceProxy.getPricePackageForView(pricePackageId).subscribe(result => {

                this.pricePackage = result.pricePackage;
                this.pricePackageName = result.pricePackage.name;
            });
        }
        else
        {
            this.pricePackage = null;
            this.pricePackageName = null;
        }
    }

    editPricePackage() {
        this.createOrEditPricePackageModal.show(this.student.pricePackageId, true, false);
    }

    setPricePackageIdNull() {
        this.student.pricePackageId = null;
        this.pricePackageName = '';
    }

    openSelectPricePackageModal() {

        this.pricePackageLookupTableModal.id = this.student.pricePackageId;
        this.pricePackageLookupTableModal.displayName = this.pricePackageName;

        this.pricePackageLookupTableModal.show();
    }

    getNewPricePackageId() {

        this.student.pricePackageId = this.pricePackageLookupTableModal.id;
        this.pricePackageName = this.pricePackageLookupTableModal.displayName;
    }
}
