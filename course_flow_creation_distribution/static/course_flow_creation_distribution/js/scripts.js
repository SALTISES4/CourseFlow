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
    title: "",
    description: "",
    author: null,
    componentType: null,
    work_classification: null,
    activity_classification: null,
    isWeek: this.props.isWeek,
    isCourse: this.props.isCourse,
    isNode: this.props.isNode,
    isProgramLevelComponent: this.props.isProgramLevelComponent,
    isCourseLevelComponent: this.props.isCourseLevelComponent,
    isDeleteForm: false,
    isUpdateForm: false
  };

  componentDidMount = e => {
    currentComponentInstance = this;
  };

  onSubmit = e => {
    if (this.state.isDeleteForm) {
    } else if (this.state.isUpdateForm) {
    } else {
      createNode(this);
    }
    e.preventDefault();
    this.setState({
      object: null,
      objectType: null,
      title: "",
      description: "",
      author: null,
      componentType: null,
      work_classification: null,
      activity_classification: null
    });
  };

  onClose = e => {
    e.preventDefault();
    this.setState({
      object: null,
      objectType: null,
      title: "",
      description: "",
      author: null,
      componentType: null,
      work_classification: null,
      activity_classification: null
    });
  };

  updateDescription = e => {
    this.setState({ description: e.target.value });
  };

  updateObjectDescription = e => {
    this.setState({
      object: { ...this.state.object, description: e.target.value }
    });
  };

  updateTitle = e => {
    this.setState({ title: e.target.value });
  };

  updateObjectTitle = e => {
    this.setState({ object: { ...this.state.object, title: e.target.value } });
  };

  render() {
    if (this.state.isDeleteForm) {
      return (
        <div>
          <Icon
            id="delete-node-button"
            primary={true}
            raised={true}
            onClick={() => {
              this.dlg.MDComponent.show();
            }}
            class="material-icons-outlined"
            style="cursor: pointer; font-size: 48px;"
          >
            add_box
          </Icon>
          <Dialog
            style="padding: 0; border: 0; width: 0;"
            ref={dlg => {
              this.dlg = dlg;
            }}
          >
            <form class="creation-form">
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
                      onInput={this.updateObjectTitle}
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText={
                        !this.state.object.work_classification &&
                        "Select a work classification"
                      }
                      selectedIndex={this.state.object.work_classification}
                      onChange={e => {
                        this.setState({
                          object: {
                            ...this.state.object,
                            work_classification: +e.target.selectedIndex - 1
                          }
                        });
                      }}
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
                      hintText={
                        !this.state.object.activity_classification &&
                        "Select an activity classification"
                      }
                      selectedIndex={this.state.object.activity_classification}
                      onChange={e => {
                        this.setState({
                          object: {
                            ...this.state.object,
                            activity_classification: +e.target.selectedIndex - 1
                          }
                        });
                      }}
                    >
                      <Select.Item>Gather Information</Select.Item>
                      <Select.Item>Discuss</Select.Item>
                      <Select.Item>Solve</Select.Item>
                      <Select.Item>Analyze</Select.Item>
                      <Select.Item>Assess/Review Papers</Select.Item>
                      <Select.Item>Whole Class</Select.Item>
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
                      onChange={e => {
                        this.setState({
                          componentType: e.target.selectedIndex
                        });
                      }}
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
                      onChange={e => {
                        this.setState({
                          componentType: e.target.selectedIndex
                        });
                      }}
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
                    value={this.state.title}
                    onInput={this.updateTitle}
                  />
                </div>
                {!this.state.isWeek && (
                  <div>
                    <TextField
                      textarea={true}
                      label="Description"
                      value={this.state.description}
                      onInput={this.updateDescription}
                    />
                  </div>
                )}
                {this.state.isNode && (
                  <div>
                    <Select
                      hintText={
                        this.state.work_classification &&
                        "Select a work classification"
                      }
                      selectedIndex={this.state.work_classification}
                      onChange={e => {
                        this.setState({
                          work_classification: e.target.selectedIndex
                        });
                      }}
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
                      hintText={
                        this.state.activity_classification &&
                        "Select an activity classification"
                      }
                      selectedIndex={this.state.activity_classification}
                      onChange={e => {
                        this.setState({
                          activity_classification: e.target.selectedIndex
                        });
                      }}
                    >
                      <Select.Item>Gather Information</Select.Item>
                      <Select.Item>Discuss</Select.Item>
                      <Select.Item>Solve</Select.Item>
                      <Select.Item>Analyze</Select.Item>
                      <Select.Item>Assess/Review Papers</Select.Item>
                      <Select.Item>Whole Class</Select.Item>
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
                    (!this.state.title && this.state.isWeek) ||
                    ((!this.state.title || !this.state.description) &&
                      !this.state.isWeek) ||
                    (this.state.isNode &&
                      (!this.state.work_classification ||
                        !this.state.activity_classification)) ||
                    ((this.state.isProgramLevelComponent ||
                      this.state.isCourseLevelComponent) &&
                      !this.state.componentType)
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

function deleteThisItem(component) {
  $.post(window.location.origin + "/dialog-form/delete", {
    json: JSON.stringify(component.state),
    props: JSON.stringify(component.props),
    hash: `${window.location.href.split("/").pop()}`
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
  $.post(window.location.origin + "/dialog-form/post", {
    json: JSON.stringify(component.state),
    props: JSON.stringify(component.props),
    hash: `${window.location.href.split("/").pop()}`
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

export function injectDialogUpdateForm(
  json,
  snackMessageOnSuccess,
  snackMessageOnFailure
) {
  if (
    document.body.contains(
      document.getElementById("node-update-form-container")
    )
  ) {
    render(
      <UpdateDialogForm
        json={json}
        snackMessageOnSuccess={snackMessageOnSuccess}
        snackMessageOnFailure={snackMessageOnFailure}
      />,
      document.getElementById("node-update-form-container")
    );
  }
}

export function injectDialogDeleteForm(
  json,
  canBeRemoved,
  snackMessageOnSuccess,
  snackMessageOnFailure
) {
  if (
    document.body.contains(
      document.getElementById("node-delete-form-container")
    )
  ) {
    render(
      <DeleteDialogForm
        json={json}
        canBeRemoved={canBeRemoved}
        snackMessageOnSuccess={snackMessageOnSuccess}
        snackMessageOnFailure={snackMessageOnFailure}
      />,
      document.getElementById("node-delete-form-container")
    );
  }
}

export var currentComponentInstance = null;

export function injectDialogForm(
  isWeek,
  isCourse,
  isNode,
  isProgramLevelComponent,
  isCourseLevelComponent,
  snackMessageOnSuccess,
  snackMessageOnFailure
) {
  if (document.body.contains(document.getElementById("node-form-container"))) {
    render(
      <CreateDialogForm
        isWeek={isWeek}
        isCourse={isCourse}
        isNode={isNode}
        isProgramLevelComponent={isProgramLevelComponent}
        isCourseLevelComponent={isCourseLevelComponent}
        snackMessageOnSuccess={snackMessageOnSuccess}
        snackMessageOnFailure={snackMessageOnFailure}
      />,
      document.getElementById("node-form-container")
    );
  }
}
