import { Component, ViewChild, Injector, Output, EventEmitter} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { StudentInvoicesServiceProxy, CreateOrEditStudentInvoiceDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';


@Component({
    selector: 'createOrEditStudentInvoiceModal',
    templateUrl: './create-or-edit-studentInvoice-modal.component.html'
})
export class CreateOrEditStudentInvoiceModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    studentInvoice: CreateOrEditStudentInvoiceDto = new CreateOrEditStudentInvoiceDto();



    constructor(
        injector: Injector,
        private _studentInvoicesServiceProxy: StudentInvoicesServiceProxy
    ) {
        super(injector);
    }

    show(studentInvoiceId?: number): void {

        if (!studentInvoiceId) {
            this.studentInvoice = new CreateOrEditStudentInvoiceDto();
            this.studentInvoice.id = studentInvoiceId;
            this.studentInvoice.date = moment().startOf('day');
            this.studentInvoice.dateDue = moment().startOf('day');

            this.active = true;
            this.modal.show();
        } else {
            this._studentInvoicesServiceProxy.getStudentInvoiceForEdit(studentInvoiceId).subscribe(result => {
                this.studentInvoice = result.studentInvoice;


                this.active = true;
                this.modal.show();
            });
        }
    }

    save(): void {
            this.saving = true;

			
            this._studentInvoicesServiceProxy.createOrEdit(this.studentInvoice)
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
