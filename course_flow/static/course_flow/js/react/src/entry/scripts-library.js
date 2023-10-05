/**
 * Individual Page/View React Renderers
 */
import * as reactDom from 'react-dom';
import * as React from 'react';
import {
  ExploreMenu,
  LibraryMenu,
  ProjectMenu,
  HomeMenu,
  FavouritesMenu
} from '../Library.js';
import * as Constants from '../Constants.js';

export class LibraryRenderer {
  constructor(){

  }

  render(container) {
    this.container = container;
    this.tiny_loader = new renderers.TinyLoader($('body')[0]);

    reactDom.render(
      this.getContents(),
      container[0]
    );
  }

  getContents() {
    return (
      <LibraryMenu renderer={this} />
    )
  }
}

export class FavouritesRenderer extends LibraryRenderer {
  getContents() {
    return (
      <FavouritesMenu renderer={this} />
    )
  }
}

export class ExploreRenderer extends LibraryRenderer {
  constructor(disciplines, initial_workflows = [], initial_pages = {}) {
    super();
    this.disciplines = disciplines;
    this.initial_workflows = initial_workflows;
    this.initial_pages = initial_pages;
    this.tiny_loader = new renderers.TinyLoader($('body')[0]);
  }

  getContents() {
    return (
      <ExploreMenu disciplines={this.disciplines} renderer={this} />
    )
  }
}

export class ProjectRenderer {
  constructor(project_data, disciplines) {
    this.project_data = project_data;
    this.all_disciplines = disciplines;
    this.read_only = true;

    if (
      project_data.object_permission &&
      project_data.object_permission.permission_type === Constants.permission_keys['edit']
    ) {
      this.read_only = false;
    }

    this.user_role = user_role;
    this.user_permission = user_permission;
  }

  render(container) {
    this.container = container;
    this.tiny_loader = new renderers.TinyLoader($('body')[0]);

    reactDom.render(
        this.getContents(),
        container[0]
    );
  }

  getContents() {
    return (
      <ProjectMenu renderer={this} data={this.project_data} />
    )
  }
}

export class HomeRenderer {
  constructor(is_teacher) {
    this.is_teacher = is_teacher
  }

  render(container) {
    this.container = container;
    this.tiny_loader = new renderers.TinyLoader($('body')[0]);

    reactDom.render(
      this.getContents(),
      container[0]
    );
  }

  getContents() {
    return (
      <HomeMenu renderer={this} />
    )
  }
}
