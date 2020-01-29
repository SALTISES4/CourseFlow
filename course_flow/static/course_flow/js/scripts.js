import { h, Component, render } from "preact";
import Dialog from "preact-material-components/Dialog";
import Button from "preact-material-components/Button";
import List from "preact-material-components/List";
import TextField from "preact-material-components/TextField";
import Radio from "preact-material-components/Radio";
import FormField from "preact-material-components/FormField";
import Icon from "preact-material-components/Icon";
import IconButton from "preact-material-components/IconButton";
import Select from "preact-material-components/Select";
import Snackbar from "preact-material-components/Snackbar";
import "preact-material-components/List/style.css";
import "preact-material-components/Menu/style.css";
import "preact-material-components/Select/style.css";
import "preact-material-components/Snackbar/style.css";
import "preact-material-components/IconButton/style.css";
import "preact-material-components/Radio/style.css";
import "preact-material-components/FormField/style.css";
import "preact-material-components/TextField/style.css";
import "preact-material-components/List/style.css";
import "preact-material-components/Button/style.css";
import "preact-material-components/Dialog/style.css";

export class DialogForm extends Component {
  state = {
    object: null,
    objectType: null,
    objectToBe: {
      title: "",
      description: "",
      author: null,
      work_classification: -1,
      activity_classification: -1
    },
    parentID: null,
    isNode: null,
    isStrategy: null,
    isActivity: null,
    isWeek: null,
    isCourse: null,
    isProgram: null,
    isCourseLevelComponent: null,
    isProgramLevelComponent: null,
    isDeleteForm: false,
    isUpdateForm: false
  };

  componentDidMount = e => {
    currentComponentInstance = this;
  };

  onSubmit = e => {
    if (this.state.isDeleteForm) {
      deleteNode(this);
    } else if (this.state.isUpdateForm) {
      updateNode(this);
    } else {
      createNode(this);
    }
    e.preventDefault();
    this.setState({
      object: null,
      objectType: null,
      objectToBe: {
        title: "",
        description: "",
        author: null,
        work_classification: -1,
        activity_classification: -1
      },
      parentID: null,
      isNode: null,
      isStrategy: null,
      isActivity: null,
      isWeek: null,
      isCourse: null,
      isProgram: null,
      isCourseLevelComponent: null,
      isProgramLevelComponent: null,
      isDeleteForm: false,
      isUpdateForm: false
    });
  };

  onClose = e => {
    e.preventDefault();
    this.setState({
      object: null,
      objectType: null,
      objectToBe: {
        title: "",
        description: "",
        author: null,
        work_classification: -1,
        activity_classification: -1
      },
      parentID: null,
      isNode: null,
      isStrategy: null,
      isActivity: null,
      isWeek: null,
      isCourse: null,
      isProgram: null,
      isCourseLevelComponent: null,
      isProgramLevelComponent: null,
      isDeleteForm: false,
      isUpdateForm: false
    });
  };

  updateObjectToBeDescription = e => {
    this.setState({
      objectToBe: { ...this.state.objectToBe, description: e.target.value }
    });
  };

  updateObjectDescription = e => {
    this.setState({
      object: { ...this.state.object, description: e.target.value }
    });
  };

  updateObjectToBeTitle = e => {
    this.setState({
      objectToBe: { ...this.state.objectToBe, title: e.target.value }
    });
  };

  updateObjectTitle = e => {
    this.setState({ object: { ...this.state.object, title: e.target.value } });
  };

  updateObjectToBeWorkClassification = e => {
    this.setState({
      objectToBe: {
        ...this.state.objectToBe,
        work_classification: +e.target.value
      }
    });
  };

  updateObjectWorkClassification = e => {
    this.setState({
      object: {
        ...this.state.object,
        work_classification: +e.target.value
      }
    });
  };

  updateObjectToBeActivityClassification = e => {
    this.setState({
      objectToBe: {
        ...this.state.objectToBe,
        activity_classification: +e.target.value
      }
    });
  };

  updateObjectActivityClassification = e => {
    this.setState({
      object: {
        ...this.state.object,
        activity_classification: +e.target.value
      }
    });
  };

  updateObjectType = e => {
    this.setState({ objectType: e.target.value });
  };

  render() {
    if (this.state.isDeleteForm) {
      return (
        <div>
          <Dialog
            //    style="padding: 0; border: 0; width: 0;"
            ref={dlg => {
              this.dlg = dlg;
            }}
          >
            <form class="deletion-form">
              <Dialog.Header>{this.state.object.title}</Dialog.Header>
              <Dialog.Body scrollable={false}>
                Are you sure you'd like to delete this {this.state.objectType}?
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.FooterButton
                  id="cancel-button"
                  cancel={true}
                  onClick={this.onClose}
                >
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
                  id="submit-button"
                  accept={true}
                  disabled={false}
                  raised={true}
                  onClick={this.onSubmit}
                >
                  Delete
                </Dialog.FooterButton>
              </Dialog.Footer>
            </form>
          </Dialog>
          <Snackbar
            ref={snack => {
              this.snack = snack;
            }}
          />
        </div>
      );
    }
    if (this.state.isUpdateForm) {
      return (
        <div>
          <Dialog
            //  style="padding: 0; border: 0; width: 0;"
            ref={dlg => {
              this.dlg = dlg;
            }}
          >
            <form class="update-form">
              <Dialog.Header></Dialog.Header>
              <Dialog.Body scrollable={false}>
                <div>
                  <TextField
                    id="title-field"
                    label="Title"
                    value={this.state.object.title}
                    onInput={this.updateObjectTitle}
                    maxlength="30"
                  />
                </div>
                {!this.state.isWeek && (
                  <div>
                    <TextField
                      id="description-field"
                      textarea={true}
                      label="Description"
                      value={this.state.object.description}
                      onInput={this.updateObjectDescription}
                      maxlength="400"
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      id="work-classification-field"
                      hintText="Select a work classification"
                      selectedIndex={this.state.object.work_classification}
                      onChange={this.updateObjectWorkClassification}
                    >
                      <Select.Item value="1">Individual Work</Select.Item>
                      <Select.Item value="2">Work in Groups</Select.Item>
                      <Select.Item value="3">Whole Class</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      id="activity-classification-field"
                      hintText="Select an activity classification"
                      selectedIndex={this.state.object.activity_classification}
                      onChange={this.updateObjectActivityClassification}
                    >
                      <Select.Item value="1">Gather Information</Select.Item>
                      <Select.Item value="2">Discuss</Select.Item>
                      <Select.Item value="3">Solve</Select.Item>
                      <Select.Item value="4">Analyze</Select.Item>
                      <Select.Item value="5">Assess/Review Papers</Select.Item>
                      <Select.Item value="6">Evaluate Peers</Select.Item>
                      <Select.Item value="7">Debate</Select.Item>
                      <Select.Item value="8">Game/Roleplay</Select.Item>
                      <Select.Item value="9">Create/Design</Select.Item>
                      <Select.Item value="10">Revise/Improve</Select.Item>
                      <Select.Item value="11">Read</Select.Item>
                      <Select.Item value="12">Write</Select.Item>
                      <Select.Item value="13">Present</Select.Item>
                      <Select.Item value="14">Experiment/Inquiry</Select.Item>
                      <Select.Item value="15">Quiz/Test</Select.Item>
                      <Select.Item value="16">Other</Select.Item>
                    </Select>
                  </div>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.FooterButton
                  id="cancel-button"
                  cancel={true}
                  onClick={this.onClose}
                >
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
                  id="submit-button"
                  accept={true}
                  disabled={
                    (!this.state.object.title && this.state.isWeek) ||
                    ((!this.state.object.title ||
                      !this.state.object.description) &&
                      !this.state.isWeek) ||
                    (this.state.isNode &&
                      (!this.state.object.work_classification ||
                        !this.state.object.activity_classification))
                  }
                  raised={true}
                  onClick={this.onSubmit}
                >
                  Update
                </Dialog.FooterButton>
              </Dialog.Footer>
            </form>
          </Dialog>
          <Snackbar
            ref={snack => {
              this.snack = snack;
            }}
          />
        </div>
      );
    } else {
      return (
        <div>
          <Dialog
            //  style="padding: 0; border: 0; width: 0;"
            ref={dlg => {
              this.dlg = dlg;
            }}
          >
            <form class="creation-form">
              <Dialog.Header></Dialog.Header>
              <Dialog.Body scrollable={false}>
                {this.state.isProgramLevelComponent && (
                  <div>
                    <Select
                      id="component-field"
                      hintText="Select a node type"
                      onChange={this.updateObjectType}
                    >
                      <Select.Item value="course">Course</Select.Item>
                      <Select.Item value="assesment">Assesment</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isCourseLevelComponent && (
                  <div>
                    <Select
                      id="component_field"
                      hintText="Select a node type"
                      onChange={this.updateObjectType}
                    >
                      <Select.Item value="activity">Activity</Select.Item>
                      <Select.Item value="assesment">Assesment</Select.Item>
                      <Select.Item value="artifact">Artifact</Select.Item>
                      <Select.Item value="preparation">Preparation</Select.Item>
                    </Select>
                  </div>
                )}
                <div>
                  <TextField
                    id="title-field"
                    label="Title"
                    value={this.state.objectToBe.title}
                    onInput={this.updateObjectToBeTitle}
                    maxlength="30"
                  />
                </div>
                {!this.state.isWeek && (
                  <div>
                    <TextField
                      id="description-field"
                      textarea={true}
                      label="Description"
                      value={this.state.objectToBe.description}
                      onInput={this.updateObjectToBeDescription}
                      maxlength="400"
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      id="work-classification-field"
                      hintText="Select a work classification"
                      selectedIndex={this.state.objectToBe.work_classification}
                      onChange={this.updateObjectToBeWorkClassification}
                    >
                      <Select.Item value="1">Individual Work</Select.Item>
                      <Select.Item value="2">Work in Groups</Select.Item>
                      <Select.Item value="3">Whole Class</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      id="activity-classification-field"
                      hintText="Select an activity classification"
                      selectedIndex={
                        this.state.objectToBe.activity_classification
                      }
                      onChange={this.updateObjectToBeActivityClassification}
                    >
                      <Select.Item value="1">Gather Information</Select.Item>
                      <Select.Item value="2">Discuss</Select.Item>
                      <Select.Item value="3">Solve</Select.Item>
                      <Select.Item value="4">Analyze</Select.Item>
                      <Select.Item value="5">Assess/Review Papers</Select.Item>
                      <Select.Item value="6">Evaluate Peers</Select.Item>
                      <Select.Item value="7">Debate</Select.Item>
                      <Select.Item value="8">Game/Roleplay</Select.Item>
                      <Select.Item value="9">Create/Design</Select.Item>
                      <Select.Item value="10">Revise/Improve</Select.Item>
                      <Select.Item value="11">Read</Select.Item>
                      <Select.Item value="12">Write</Select.Item>
                      <Select.Item value="13">Present</Select.Item>
                      <Select.Item value="14">Experiment/Inquiry</Select.Item>
                      <Select.Item value="15">Quiz/Test</Select.Item>
                      <Select.Item value="16">Other</Select.Item>
                    </Select>
                  </div>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.FooterButton
                  id="cancel-button"
                  cancel={true}
                  onClick={this.onClose}
                >
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
                  id="submit-button"
                  accept={true}
                  disabled={
                    (!this.state.objectToBe.title && this.state.isWeek) ||
                    ((!this.state.objectToBe.title ||
                      !this.state.objectToBe.description) &&
                      !this.state.isWeek) ||
                    (this.state.isNode &&
                      (!this.state.objectToBe.work_classification ||
                        !this.state.objectToBe.activity_classification)) ||
                    ((this.state.isProgramLevelComponent ||
                      this.state.isCourseLevelComponent) &&
                      !this.state.objectType)
                  }
                  raised={true}
                  onClick={this.onSubmit}
                >
                  Create
                </Dialog.FooterButton>
              </Dialog.Footer>
            </form>
          </Dialog>
          <Snackbar
            ref={snack => {
              this.snack = snack;
            }}
          />
        </div>
      );
    }
  }
}

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", getCsrfToken());
    }
  }
});

function csrfSafeMethod(method) {
  return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
}

function getCsrfToken() {
  return document
    .getElementsByName("csrfmiddlewaretoken")[0]
    .getAttribute("value");
}

function deleteNode(component) {
  $.post(window.location.origin + "/course-flow/dialog-form/delete", {
    objectID: JSON.stringify(component.state.object.id),
    objectType: JSON.stringify(component.state.objectType)
  })
    .done(function(data) {
      if (data.action == "posted") {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnSuccess
        });
      } else {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnFailure
        });
      }
    })
    .fail(function(data) {
      component.snack.MDComponent.show({
        message: component.props.snackMessageOnFailure
      });
    });
}

function updateNode(component) {
  $.post(window.location.origin + "/course-flow/dialog-form/update", {
    object: JSON.stringify(component.state.object),
    objectID: JSON.stringify(component.state.object.id),
    objectType: JSON.stringify(component.state.objectType)
  })
    .done(function(data) {
      if (data.action == "posted") {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnSuccess
        });
      } else {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnFailure
        });
      }
    })
    .fail(function(data) {
      component.snack.MDComponent.show({
        message: component.props.snackMessageOnFailure
      });
    });
}

//post new node
function createNode(component) {
  $.post(window.location.origin + "/course-flow/dialog-form/create", {
    object: JSON.stringify(component.state.objectToBe),
    objectType: JSON.stringify(component.state.objectType),
    parentID: JSON.stringify(component.state.parentID),
    isProgramLevelComponent: JSON.stringify(
      component.state.isProgramLevelComponent
    )
  })
    .done(function(data) {
      if (data.action == "posted") {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnSuccess
        });
      } else {
        component.snack.MDComponent.show({
          message: component.props.snackMessageOnFailure
        });
      }
    })
    .fail(function(data) {
      component.snack.MDComponent.show({
        message: component.props.snackMessageOnFailure
      });
    });
}

export var currentComponentInstance = null;

export function injectDialogForm(snackMessageOnSuccess, snackMessageOnFailure) {
  if (document.body.contains(document.getElementById("node-form-container"))) {
    render(
      <DialogForm
        snackMessageOnSuccess={snackMessageOnSuccess}
        snackMessageOnFailure={snackMessageOnFailure}
      />,
      document.getElementById("node-form-container")
    );
  }
}
