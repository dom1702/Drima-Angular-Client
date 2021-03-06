import { Component, ViewChild, Injector, Output, EventEmitter} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { OfficesServiceProxy, CreateOrEditOfficeDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';


@Component({
    selector: 'createOrEditOfficeModal',
    templateUrl: './create-or-edit-office-modal.component.html'
})
export class CreateOrEditOfficeModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    office: CreateOrEditOfficeDto = new CreateOrEditOfficeDto();



    constructor(
        injector: Injector,
        private _officesServiceProxy: OfficesServiceProxy
    ) {
        super(injector);
    }

    show(officeId?: number): void {

        if (!officeId) {
            this.office = new CreateOrEditOfficeDto();
            this.office.id = officeId;

            this.active = true;
            this.modal.show();
        } else {
            this._officesServiceProxy.getOfficeForEdit(officeId).subscribe(result => {
                this.office = result.office;


                this.active = true;
                this.modal.show();
            });
        }
    }

    save(): void {
            this.saving = true;

			
            this._officesServiceProxy.createOrEdit(this.office)
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
