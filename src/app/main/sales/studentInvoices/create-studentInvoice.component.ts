import { Component, ViewChild, Injector, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { StudentInvoicesServiceProxy, CreateOrEditStudentInvoiceDto, StudentsServiceProxy, ProductsServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { formatCurrency } from '@angular/common';
import { NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { InvoiceStudentLookupTableModalComponent } from './invoice-student-lookup-table-modal.component';
import { InvoiceProductLookupTableModalComponent } from './invoice-product-lookup-table-modal.component';


@Component({
  templateUrl: './create-studentInvoice.component.html',
  animations: [appModuleAnimation()]
})
export class CreateStudentInvoiceComponent extends AppComponentBase implements OnInit {

  @ViewChild('studentLookupTableModal') studentLookupTableModal: InvoiceStudentLookupTableModalComponent;
  @ViewChild('productLookupTableModal') productLookupTableModal: InvoiceProductLookupTableModalComponent;

  active = false;
  saving = false;

  studentInvoice: CreateOrEditStudentInvoiceDto = new CreateOrEditStudentInvoiceDto();
  studentFullName = '';
  studentFirstName = '';
  studentLastName = '';
  studentSet: boolean;

  senderCompanyName: string;

  form: FormGroup;

  exampleItems = [
    {
      index: 0,
      product: 'tuna',
      qty: 2,
      priceBeforeVat: 10000,
      itemVat: 20,
      priceAfterVat: 12000,
      sum: 24000
    },
    {
      index: 1,
      product: 'tuna',
      qty: 2,
      priceBeforeVat: 10000,
      itemVat: 20,
      priceAfterVat: 12000,
      sum: 24000
    },
    {
      index: 2,
      product: 'tuna',
      qty: 2,
      priceBeforeVat: 10000,
      itemVat: 20,
      priceAfterVat: 12000,
      sum: 24000
    }
  ];

  itemForm: FormGroup;

  previousItemForm: FormGroup;

  itemFormSubscription: Subscription;

  constructor(
    injector: Injector,
    private _studentInvoicesServiceProxy: StudentInvoicesServiceProxy,
    private _studentsServiceProxy: StudentsServiceProxy,
    private _productsServiceProxy: ProductsServiceProxy,
    private _router: Router,
    private fb: FormBuilder
  ) {
    super(injector);
    this.buildForm(fb);
  }

  buildForm(fb: FormBuilder): void {
    this.form = fb.group({

      index: [''],

      recipientFirstName: [''],
      recipientLastName: [''],
      recipientStreet: [''],
      recipientZipCode: [''],
      recipientCity: [''],

      totalBeforeVat: ['0'],
      totalVat: ['0'],
      totalAfterVat: ['0']

    });
  }

  ngOnInit(): void {

    this.active = true;

    // this.itemForm = this.fb.group({
    //     items: this.fb.array([])
    //   });

    this.itemForm = this.fb.group({

      items: this.fb.array([

        // this.fb.group({
        //   product: ['1', Validators.required],
        //   qty: ['1'],
        //   priceBeforeVat: ['1'],
        //   itemVat: ['1', Validators.required],
        //   priceAfterVat: ['1', Validators.required],
        //   sum: ['1', Validators.required]
        // })

      ])

    });

    this.getExampleItems();

    this.subscribeToItemFormValueChanges();

    this.updateTotalBeforeVat();
    this.updateTotalVat();
    this.updateTotalAfterVat();

    this.previousItemForm = _.cloneDeep(this.itemForm);

    // if (!studentInvoiceId) {
    //     this.studentInvoice = new CreateOrEditStudentInvoiceDto();
    //     this.studentInvoice.id = studentInvoiceId;
    //     this.studentInvoice.date = moment().startOf('day');
    //     this.studentInvoice.dateDue = moment().startOf('day');

    //     this.active = true;
    //     this.modal.show();
    // } else {
    //     this._studentInvoicesServiceProxy.getStudentInvoiceForEdit(studentInvoiceId).subscribe(result => {
    //         this.studentInvoice = result.studentInvoice;


    //         this.active = true;
    //         this.modal.show();
    //     });
    // }

    if (this.studentInvoice == null) {
      this.studentInvoice = new CreateOrEditStudentInvoiceDto();
      //this.studentInvoice.id = studentInvoiceId;
      this.studentInvoice.date = moment().startOf('day');
      this.studentInvoice.dateDue = moment().startOf('day');

      //this.active = true;
      //this.modal.show();
      this.studentSet = false;
    }
  }

  getExampleItems() {
    const control = <FormArray>this.itemForm.get('items');
    for (const emp of this.exampleItems) {
      const grp = this.fb.group({
        product: [emp.product, Validators.required],
        qty: [emp.qty],
        priceBeforeVat: [emp.priceBeforeVat],
        itemVat: [emp.itemVat, Validators.required],
        priceAfterVat: [emp.priceAfterVat, Validators.required],
        sum: [emp.sum, Validators.required],
        index: [emp.index]
      });
      control.push(grp);
    }
  }

  getEmptyItem(): FormGroup {
    return this.fb.group({
      product: ['', Validators.required],
      qty: [''],
      priceBeforeVat: ['', [Validators.min(10)]],
      itemVat: [''],
      priceAfterVat: [''],
      sum: [''],
    });
  }

  get getFormData(): FormArray {
    return <FormArray>this.itemForm.get('items');
  }

  addItem() {
    const control = <FormArray>this.itemForm.get('items');
    control.push(this.getEmptyItem());
  }

  remove(index: number) {
    const control = <FormArray>this.itemForm.get('items');
    control.removeAt(index);

    this.updateTotalBeforeVat();
    this.updateTotalVat();
    this.updateTotalAfterVat();
  }

  getControlLabel(type: string) {
    return this.form.controls[type].value;
  }

  getItemControlLabel(id: number, type: string) {
    const control = <FormArray>this.itemForm.get('items');
    return control.at(id).get(type).value;
  }

  updateTotalBeforeVat() {
    let totalBeforeTax = 0;
    var control = <FormArray>this.itemForm.get('items');

    for (var i = 0; i < control.length; i++) {
      totalBeforeTax += control.at(i).get('priceBeforeVat').value * control.at(i).get('qty').value;
      //console.log(totalBeforeTax);
    }

    this.form.controls['totalBeforeVat'].setValue(totalBeforeTax);
  }

  updateTotalVat() {
    let totalTax = 0;
    var control = <FormArray>this.itemForm.get('items');

    for (var i = 0; i < control.length; i++) {
      totalTax += control.at(i).get('priceBeforeVat').value / 100 * control.at(i).get('itemVat').value * control.at(i).get('qty').value;
      //console.log(totalTax);
    }

    this.form.controls['totalVat'].setValue(totalTax);
  }

  updateTotalAfterVat() {
    let totalAfterTax = 0;
    var control = <FormArray>this.itemForm.get('items');

    for (var i = 0; i < control.length; i++) {
      totalAfterTax += control.at(i).get('priceBeforeVat').value * (1 + control.at(i).get('itemVat').value / 100) * control.at(i).get('qty').value;
      //console.log(totalAfterTax);
    }

    this.form.controls['totalAfterVat'].setValue(totalAfterTax);
  }

  updateItems() {
    this.unsubscribeToItemFormValueChanges();

    console.log(this.previousItemForm);
    console.log(this.itemForm);

    var control = <FormArray>this.itemForm.get('items');
    var controlPrev = <FormArray>this.previousItemForm.get('items');

    if (control.length != controlPrev.length) {
      this.previousItemForm = _.cloneDeep(this.itemForm)
      controlPrev = <FormArray>this.previousItemForm.get('items');
    }


    for (var i = 0; i < control.length; i++) {
      if (control.at(i).get('qty').value != controlPrev.at(i).get('qty').value) {
        control.at(i).get('sum').setValue(control.at(i).get('qty').value * control.at(i).get('priceAfterVat').value);
      }

      if (control.at(i).get('priceBeforeVat').value != controlPrev.at(i).get('priceBeforeVat').value
        || control.at(i).get('itemVat').value != controlPrev.at(i).get('itemVat').value) {
        var priceAfterVatValue = control.at(i).get('priceBeforeVat').value * (1 + control.at(i).get('itemVat').value / 100);
        control.at(i).get('priceAfterVat').setValue(priceAfterVatValue);
        //.setValue(formatCurrency(priceAfterVatValue, 'de', ''));

        control.at(i).get('sum').setValue(control.at(i).get('qty').value * control.at(i).get('priceAfterVat').value);
      }

      if (control.at(i).get('priceAfterVat').value != controlPrev.at(i).get('priceAfterVat').value) {

        var priceBeforeVatValue = control.at(i).get('priceAfterVat').value / (100 + control.at(i).get('itemVat').value) * 100;
        control.at(i).get('priceBeforeVat').setValue(priceBeforeVatValue);


        control.at(i).get('sum').setValue(control.at(i).get('qty').value * control.at(i).get('priceAfterVat').value);
      }

      // if(control.at(i).get('itemVat').value != controlPrev.at(i).get('itemVat').value)
      // {
      //   var priceAfterVatValue = control.at(i).get('priceBeforeVat').value * (1 + control.at(i).get('itemVat').value / 100);
      //   control.at(i).get('priceAfterVat').setValue(priceAfterVatValue);
      // }
    }

    this.previousItemForm = _.cloneDeep(this.itemForm);

    this.subscribeToItemFormValueChanges();
  }

  subscribeToItemFormValueChanges() {
    this.itemFormSubscription = this.itemForm.valueChanges.subscribe((value) => {

      //console.log(value);

      this.updateTotalBeforeVat();
      this.updateTotalVat();
      this.updateTotalAfterVat();
      this.updateItems();

    });
  }

  unsubscribeToItemFormValueChanges() {
    if (this.itemFormSubscription != null)
      this.itemFormSubscription.unsubscribe();
  }

  save(): void {
    this.saving = true;
    console.log('isValid', this.itemForm.valid);
    console.log('value', this.itemForm.value);
    console.log(this.form);
    // this._studentInvoicesServiceProxy.createOrEdit(this.studentInvoice)
    //  .pipe(finalize(() => { this.saving = false;}))
    //  .subscribe(() => {
    //     this.notify.info(this.l('SavedSuccessfully'));
    //     this.close();
    //  });
  }

  close(): void {

    this.active = false;
    this._router.navigate(['app/main/sales/studentInvoices']);
  }

  addProduct() {
    this.productLookupTableModal.show();
  }

  getNewProductId() {

    if (this.productLookupTableModal.id == -1)
      return;

    this.primengTableHelper.showLoadingIndicator();

    this._productsServiceProxy.getProductForView(this.productLookupTableModal.id)
      .subscribe(result => {

        this.addItem();

        this.unsubscribeToItemFormValueChanges();

        var control = <FormArray>this.itemForm.get('items');

        control.at(control.length - 1).get('qty').setValue(1);
        control.at(control.length - 1).get('priceAfterVat').setValue(result.product.price);
        control.at(control.length - 1).get('itemVat').setValue(result.product.vat);

        var priceBeforeVatValue = control.at(control.length - 1).get('priceAfterVat').value / (100 + control.at(control.length - 1).get('itemVat').value) * 100;
        control.at(control.length - 1).get('priceBeforeVat').setValue(priceBeforeVatValue);

        control.at(control.length - 1).get('sum').setValue(control.at(control.length - 1).get('qty').value * control.at(control.length - 1).get('priceAfterVat').value);

        this.subscribeToItemFormValueChanges();

        this.updateTotalBeforeVat();
        this.updateTotalVat();
        this.updateTotalAfterVat();

        this.primengTableHelper.hideLoadingIndicator();

      });



  }

  setStudentIdNull() {
    this.studentInvoice.studentId = null;
    this.studentFirstName = '';
    this.studentLastName = '';
    this.refreshStudentFullName();
    this.studentSet = false;
  }

  openSelectStudentModal() {

    //this.studentLookupTableModal.id = this.studentInvoice.studentId;
    this.studentLookupTableModal.firstName = this.studentFirstName;
    this.studentLookupTableModal.lastName = this.studentLastName;
    this.refreshStudentFullName();
    this.studentLookupTableModal.show();
  }

  getNewStudentId() {

    this.studentSet = true;
    console.log(this.studentSet);
    this.studentInvoice.studentId = this.studentLookupTableModal.id;
    this.studentFirstName = this.studentLookupTableModal.firstName;
    this.studentLastName = this.studentLookupTableModal.lastName;
    this.refreshStudentFullName();

    this.primengTableHelper.showLoadingIndicator();

    this._studentsServiceProxy.getStudentForView(this.studentInvoice.studentId)
      .subscribe(result => {

        this.form.get('recipientFirstName').setValue(result.student.firstName);
        this.form.get('recipientLastName').setValue(result.student.lastName);
        this.form.get('recipientStreet').setValue(result.student.street);
        this.form.get('recipientZipCode').setValue(result.student.zipCode);
        this.form.get('recipientCity').setValue(result.student.city);

        this.primengTableHelper.hideLoadingIndicator();

      });
  }

  refreshStudentFullName() {
    this.studentFullName = this.studentFirstName + ' ' + this.studentLastName;
  }
}

