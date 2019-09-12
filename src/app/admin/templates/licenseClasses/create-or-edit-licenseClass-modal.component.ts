import { Component, ViewChild, Injector, Output, EventEmitter} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { LicenseClassesServiceProxy, CreateOrEditLicenseClassDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';


@Component({
    selector: 'createOrEditLicenseClassModal',
    templateUrl: './create-or-edit-licenseClass-modal.component.html'
})
export class CreateOrEditLicenseClassModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    licenseClass: CreateOrEditLicenseClassDto = new CreateOrEditLicenseClassDto();



    constructor(
        injector: Injector,
        private _licenseClassesServiceProxy: LicenseClassesServiceProxy
    ) {
        super(injector);
    }

    show(licenseClassId?: number): void {

        if (!licenseClassId) {
            this.licenseClass = new CreateOrEditLicenseClassDto();
            this.licenseClass.id = licenseClassId;

            this.active = true;
            this.modal.show();
        } else {
            this._licenseClassesServiceProxy.getLicenseClassForEdit(licenseClassId).subscribe(result => {
                this.licenseClass = result.licenseClass;


                this.active = true;
                this.modal.show();
            });
        }
    }

    save(): void {
            this.saving = true;

			
            this._licenseClassesServiceProxy.createOrEdit(this.licenseClass)
             .pipe(finalize(() => { this.saving = false;}))
             .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
             });
    }







    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
