import { Component, ViewChild, Injector, Output, EventEmitter, OnInit} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { StudentsServiceProxy, CreateOrEditStudentDto, PricePackagesServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { PricePackageLookupTableModalComponent } from './pricePackage-lookup-table-modal.component';


@Component({
    selector: 'createOrEditStudentModal',
    templateUrl: './create-or-edit-student-modal.component.html'
})
export class CreateOrEditStudentModalComponent extends AppComponentBase implements OnInit {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('pricePackageLookupTableModal') pricePackageLookupTableModal: PricePackageLookupTableModalComponent;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    student: CreateOrEditStudentDto = new CreateOrEditStudentDto();

    dateOfBirth: Date;
    licenseClassClass = '';

    dropdownList = [];
    selectedItems = [];
    dropdownSettings = {};

    placeholder = 'None';

    pricePackageName = '';

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _pricePackageServiceProxy : PricePackagesServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.dropdownSettings = {
            singleSelection: false,
            idField: 'item_id',
            textField: 'item_text',
            selectAllText: 'Select All',
            unSelectAllText: 'Unselect All',
            allowSearchFilter: false
        };
    }

    onItemSelect(item: any) {
        console.log(item);
    }

    onSelectAll(items: any) {
        console.log(items);
    }


    show(studentId?: number): void {

        this.dateOfBirth = null;

        if (!studentId) {
            this.student = new CreateOrEditStudentDto();
            //this.student.id = 0;
            this.licenseClassClass = null;
            this.pricePackageName = '';
            //this.student.pricePackageId = 0;

            this.active = true;
            this.updateLicenseClass(false);
            this.modal.show();
        } else {
            this._studentsServiceProxy.getStudentForEdit(studentId).subscribe(result => {
                this.student = result.student;
                this.student.id = studentId;

                if (this.student.dateOfBirth) {
					this.dateOfBirth = this.student.dateOfBirth.toDate();
                }

                this.pricePackageName = result.pricePackageName;

                this.active = true;
                this.updateLicenseClass(true);
                this.modal.show();
            });
        }
    }

    updateLicenseClass(studentAvailable : boolean ) : void
    {
        if (!this.active) {
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        this._studentsServiceProxy.getAllLicenseClassForLookupTable(
            "",
            "",
            0,
            1000).subscribe(result => {

                // for(var r = 0; r < result.items.length; r++)
                //     console.log(result.items[r].id);
    
                this.dropdownList = [];
                this.selectedItems = [];

                for (var _i = 0; _i < result.items.length; _i++) 
                {   
                    this.dropdownList.push(
                    {
                        item_id: _i, 
                        item_text: result.items[_i].displayName
                    });
                }

                if(studentAvailable)
                {
                    for (var item of this.dropdownList) {
                        for (var studentClasses of this.student.licenseClasses) {
                            //console.log(item.item_text);
                            //console.log(studentClasses);
                            if(item.item_text == studentClasses)
                            {
                                //console.log("Add it now");
                                this.selectedItems.push(
                                    {
                                        item_id: item.item_id,
                                        item_text: item.item_text
                                    }
                                );
                            }
                        }
                        
                    }

                    //console.log(this.selectedItems.length);
                }

                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    save(): void {
            this.saving = true;

        this.student.licenseClasses = [];

        for (var licenseClass of this.selectedItems)
        {
            this.student.licenseClasses.push(
                licenseClass.item_text
            );
        }
			
        if (this.dateOfBirth) {
            if (!this.student.dateOfBirth) {
                this.student.dateOfBirth = moment(this.dateOfBirth).startOf('day');
            }
            else {
                this.student.dateOfBirth = moment(this.dateOfBirth);
            }
        }
        else {
            this.student.dateOfBirth = null;
        }
        
        this._studentsServiceProxy.createOrEdit(this.student)
            .pipe(finalize(() => { this.saving = false;}))
            .subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
            this.close();
            this.modalSave.emit(null);
            });
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


    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
