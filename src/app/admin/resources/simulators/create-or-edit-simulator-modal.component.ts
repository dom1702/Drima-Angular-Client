import { Component, ViewChild, Injector, Output, EventEmitter} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { SimulatorsServiceProxy, CreateOrEditSimulatorDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { SimulatorOfficeLookupTableModalComponent } from './simulator-office-lookup-table-modal.component';


@Component({
    selector: 'createOrEditSimulatorModal',
    templateUrl: './create-or-edit-simulator-modal.component.html'
})
export class CreateOrEditSimulatorModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal', { static: true }) modal: ModalDirective;
    @ViewChild('simulatorOfficeLookupTableModal', { static: true }) simulatorOfficeLookupTableModal: SimulatorOfficeLookupTableModalComponent;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    simulator: CreateOrEditSimulatorDto = new CreateOrEditSimulatorDto();

    officeName = '';


    constructor(
        injector: Injector,
        private _simulatorsServiceProxy: SimulatorsServiceProxy
    ) {
        super(injector);
    }

    show(simulatorId?: number): void {

        if (!simulatorId) {
            this.simulator = new CreateOrEditSimulatorDto();
            this.simulator.id = simulatorId;
            this.officeName = '';

            this.active = true;
            this.modal.show();
        } else {
            this._simulatorsServiceProxy.getSimulatorForEdit(simulatorId).subscribe(result => {
                this.simulator = result.simulator;

                this.officeName = result.officeName;

                this.active = true;
                this.modal.show();
            });
        }
    }

    save(): void {
            this.saving = true;

			
            this._simulatorsServiceProxy.createOrEdit(this.simulator)
             .pipe(finalize(() => { this.saving = false;}))
             .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
             });
    }

        openSelectOfficeModal() {
        this.simulatorOfficeLookupTableModal.id = this.simulator.officeId;
        this.simulatorOfficeLookupTableModal.displayName = this.officeName;
        this.simulatorOfficeLookupTableModal.show();
    }


        setOfficeIdNull() {
        this.simulator.officeId = null;
        this.officeName = '';
    }


        getNewOfficeId() {
        this.simulator.officeId = this.simulatorOfficeLookupTableModal.id;
        this.officeName = this.simulatorOfficeLookupTableModal.displayName;
    }


    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
