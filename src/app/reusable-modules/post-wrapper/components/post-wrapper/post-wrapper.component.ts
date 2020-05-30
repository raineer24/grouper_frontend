import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { IPost } from '@core/interfaces';
import { DialogService } from '@core/services';

@Component({
  selector: 'app-post-wrapper',
  templateUrl: './post-wrapper.component.html',
  styleUrls: ['./post-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostWrapperComponent implements OnInit, OnDestroy {
  @Input() post: IPost;
  @Input() isOwner: boolean;
  @Input() isOwnerOrAdmin: boolean;
  @Input() postEditing$: Observable<boolean>;
  @Output() sendUpdate: EventEmitter<{ id: number; data: FormData }>;
  @Input() postDeleting$: Observable<boolean>;
  @Input() sendDelete: EventEmitter<{ id: number }>;
  dropdownVisible: boolean;
  editForm: FormGroup;
  formVisibility: boolean;
  image: File;
  file: File;
  subscription: Subscription;
  postEditing: boolean;

  constructor(@Inject(DOCUMENT) private document: Document, private dialogService: DialogService) {
    this.sendUpdate = new EventEmitter<{ id: number; data: FormData }>();
    this.dropdownVisible = false;
  }

  ngOnInit(): void {
    this.editForm = new FormGroup({
      content: new FormControl(this.post.content, Validators.required),
    });
    this.postEditing = false;
    this.subscription = this.postEditing$.subscribe((res) => {
      res ? this.editForm.disable() : this.editForm.enable();
      if (!res && this.postEditing) {
        this.formVisibility = false;
      }
      this.postEditing = res;
    });
  }

  dropdownToggle(event) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  @HostListener('window:click', ['$event']) hideDropdown(event) {
    const dropdown = this.document.querySelector('.dropdown');
    if (this.dropdownVisible && event.target !== dropdown) {
      this.dropdownVisible = false;
    }
  }

  hoverOption(event) {
    event.target.classList.add('u-item--hover');
  }

  unHoverOption(event) {
    event.target.classList.remove('u-item--hover');
  }

  editButton(event) {
    this.formVisibility = true;
  }

  deleteButton(event) {
    event.stopPropagation();
    this.dialogService.showDialog({
      header: 'Jesteś pewien?',
      caption: 'Tej operacji nie da sie cofnąć',
      onAcceptCallback: () => {
        this.sendDelete.emit({ id: this.post.id });
      },
      loadingSelect: this.postDeleting$,
    });
  }

  hideForm() {
    this.editForm.get('content').setValue(this.post.content);
    this.formVisibility = false;
  }

  chooseImage() {
    const input = this.document.querySelector('.image__input');
    input.dispatchEvent(new MouseEvent('click'));
  }

  chooseFile() {
    const input = this.document.querySelector('.file__input');
    input.dispatchEvent(new MouseEvent('click'));
  }

  get content() {
    return this.editForm.get('content');
  }

  get data(): FormData {
    const fd = new FormData();
    fd.append('content', this.content.value);
    if (this.image) {
      fd.append('image', this.image);
    }
    if (this.file) {
      fd.append('file', this.file);
    }
    return fd;
  }

  updatePost() {
    this.sendUpdate.emit({ id: this.post.id, data: this.data });
  }

  imageChange($event) {
    this.image = $event.target.files[0];
  }

  fileChange($event) {
    this.file = $event.target.files[0];
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}