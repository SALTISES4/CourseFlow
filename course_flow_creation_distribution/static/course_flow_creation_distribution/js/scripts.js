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

export class CreateDialogForm extends Component {
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
    componentType: null,
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
      componentType: null,
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
      componentType: null,
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
        work_classification: e.target.selectedIndex
      }
    });
  };

  updateObjectWorkClassification = e => {
    console.log(e.target.selectedIndex);
    this.setState({
      object: {
        ...this.state.object,
        work_classification: e.target.selectedIndex
      }
    });
  };

  updateObjectToBeActivityClassification = e => {
    this.setState({
      objectToBe: {
        ...this.state.objectToBe,
        work_classification: e.target.selectedIndex
      }
    });
  };

  updateObjectActivityClassification = e => {
    console.log(e.target.selectedIndex);
    this.setState({
      object: {
        ...this.state.object,
        activity_classification: e.target.selectedIndex
      }
    });
  };

  updateObjectToBeComponentType = e => {
    this.setState({ componentType: e.target.selectedIndex });
    if (component.state.isCourseLevelComponent) {
      switch (component.state.componentType) {
        case 1:
          component.setState({ objectType: "activity" });
          break;
        case 2:
          component.setState({ objectType: "assesment" });
          break;
        case 3:
          component.setState({ objectType: "artifact" });
          break;
        case 4:
          component.setState({ objectType: "preparation" });
          break;
      }
    } else if (component.state.isProgramLevelComponent) {
      switch (component.state.componentType) {
        case 1:
          component.setState({ objectType: "course" });
          break;
        case 2:
          component.setState({ objectType: "preparation" });
          break;
      }
    }
  };

  render() {
    if (this.state.isDeleteForm) {
      return (
        <div>
          <Dialog
            style="padding: 0; border: 0; width: 0;"
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
                <Dialog.FooterButton cancel={true} onClick={this.onClose}>
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
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
            style="padding: 0; border: 0; width: 0;"
            ref={dlg => {
              this.dlg = dlg;
            }}
          >
            <form class="update-form">
              <Dialog.Header></Dialog.Header>
              <Dialog.Body scrollable={false}>
                <div>
                  <TextField
                    label="Title"
                    value={this.state.object.title}
                    onInput={this.updateObjectTitle}
                  />
                </div>
                {!this.state.isWeek && (
                  <div>
                    <TextField
                      textarea={true}
                      label="Description"
                      value={this.state.object.description}
                      onInput={this.updateObjectDescription}
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText="Select a work classification"
                      selectedIndex={this.state.object.work_classification}
                      onChange={this.updateObjectWorkClassification}
                    >
                      <Select.Item>Individual Work</Select.Item>
                      <Select.Item>Work in Groups</Select.Item>
                      <Select.Item>Whole Class</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText="Select an activity classification"
                      selectedIndex={this.state.object.activity_classification}
                      onChange={this.updateObjectActivityClassification}
                    >
                      <Select.Item>Gather Information</Select.Item>
                      <Select.Item>Discuss</Select.Item>
                      <Select.Item>Solve</Select.Item>
                      <Select.Item>Analyze</Select.Item>
                      <Select.Item>Assess/Review Papers</Select.Item>
                      <Select.Item>Evaluate Peers</Select.Item>
                      <Select.Item>Debate</Select.Item>
                      <Select.Item>Game/Roleplay</Select.Item>
                      <Select.Item>Create/Design</Select.Item>
                      <Select.Item>Revise/Improve</Select.Item>
                      <Select.Item>Read</Select.Item>
                      <Select.Item>Write</Select.Item>
                      <Select.Item>Present</Select.Item>
                      <Select.Item>Experiment/Inquiry</Select.Item>
                      <Select.Item>Quiz/Test</Select.Item>
                      <Select.Item>Other</Select.Item>
                    </Select>
                  </div>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.FooterButton cancel={true} onClick={this.onClose}>
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
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
            style="padding: 0; border: 0; width: 0;"
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
                      hintText="Select a node type"
                      selectedIndex={this.state.componentType}
                      onChange={this.updateComponentType}
                    >
                      <Select.Item>Course</Select.Item>
                      <Select.Item>Assesment</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isCourseLevelComponent && (
                  <div>
                    <Select
                      hintText="Select a node type"
                      selectedIndex={this.state.componentType}
                      onChange={this.updateComponentType}
                    >
                      <Select.Item>Activity</Select.Item>
                      <Select.Item>Assesment</Select.Item>
                      <Select.Item>Artifact</Select.Item>
                      <Select.Item>Preparation</Select.Item>
                    </Select>
                  </div>
                )}
                <div>
                  <TextField
                    label="Title"
                    value={this.state.objectToBe.title}
                    onInput={this.updateObjectToBeTitle}
                  />
                </div>
                {!this.state.isWeek && (
                  <div>
                    <TextField
                      textarea={true}
                      label="Description"
                      value={this.state.objectToBe.description}
                      onInput={this.updateObjectToBeDescription}
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText="Select a work classification"
                      selectedIndex={this.state.objectToBe.work_classification}
                      onChange={this.updateObjectToBeWorkClassification}
                    >
                      <Select.Item>Individual Work</Select.Item>
                      <Select.Item>Work in Groups</Select.Item>
                      <Select.Item>Whole Class</Select.Item>
                    </Select>
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText="Select an activity classification"
                      selectedIndex={
                        this.state.objectToBe.activity_classification
                      }
                      onChange={this.updateObjectToBeActivityClassification}
                    >
                      <Select.Item>Gather Information</Select.Item>
                      <Select.Item>Discuss</Select.Item>
                      <Select.Item>Solve</Select.Item>
                      <Select.Item>Analyze</Select.Item>
                      <Select.Item>Assess/Review Papers</Select.Item>
                      <Select.Item>Evaluate Peers</Select.Item>
                      <Select.Item>Debate</Select.Item>
                      <Select.Item>Game/Roleplay</Select.Item>
                      <Select.Item>Create/Design</Select.Item>
                      <Select.Item>Revise/Improve</Select.Item>
                      <Select.Item>Read</Select.Item>
                      <Select.Item>Write</Select.Item>
                      <Select.Item>Present</Select.Item>
                      <Select.Item>Experiment/Inquiry</Select.Item>
                      <Select.Item>Quiz/Test</Select.Item>
                      <Select.Item>Other</Select.Item>
                    </Select>
                  </div>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.FooterButton cancel={true} onClick={this.onClose}>
                  Cancel
                </Dialog.FooterButton>
                <Dialog.FooterButton
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
                      !this.state.objectToBe.componentType)
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
  $.post(window.location.origin + "/dialog-form/delete", {
    objectID: JSON.stringify(component.state.object.id),
    objectType: JSON.stringify(component.state.objectType)
  })
    .done(function(data) {
      console.log(data.action);
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
  $.post(window.location.origin + "/dialog-form/update", {
    object: JSON.stringify(component.state.object),
    objectType: JSON.stringify(component.state.objectType)
  })
    .done(function(data) {
      console.log(data.action);
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
  $.post(window.location.origin + "/dialog-form/create", {
    object: JSON.stringify(component.state.objectToBe),
    objectType: JSON.stringify(component.state.objectType),
    parentID: JSON.stringify(component.state.parentID),
    isProgramLevelComponent: JSON.stringify(
      component.state.isProgramLevelComponent
    )
  })
    .done(function(data) {
      console.log(data.action);
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
      <CreateDialogForm
        snackMessageOnSuccess={snackMessageOnSuccess}
        snackMessageOnFailure={snackMessageOnFailure}
      />,
      document.getElementById("node-form-container")
    );
  }
}
