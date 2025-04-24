import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList,checkExportStatus,getExportDownload} from "./PostFunctions";
import {Loader} from "./Constants";

export class ExportMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={type:"outcome",export_method:"email",jobs:[]}
    }

    componentDidMount() {
        this.fetchJobs();
        this.intervalId = setInterval(this.fetchJobs, 30000); // every 30 seconds
    }

    componentWillUnmount() {
        clearInterval(this.intervalId);
    }

    render(){
        let object_sets;
        let jobs = this.state.jobs;
        if(this.props.data.object_sets.length>0){
            object_sets = (
                [<h4>{gettext("Object Set Visibility")}:</h4>,
                this.props.data.object_sets.map(objectset=>
                    <div>
                        <input onChange={this.inputChange.bind(this,"set",objectset.id)} name="object_sets[]" value={objectset.id} type="checkbox" id={objectset.id} checked={(!this.state[objectset.id])}/><label>{objectset.title}</label>
                    </div>
                )
                ]
            )
        }

        return(
            <div class="message-wrap">
                <h2>{gettext("Export files")}</h2>
                <p>{gettext("Use this menu to export files.")}</p>
                <form id="export-form" enctype="multipart/form-data" action={post_paths.get_export} method="POST" target="redirect-iframe" onSubmit={this.submit.bind(this)}>
                    <input type="hidden" name="csrfmiddlewaretoken" value={root.getCsrfToken()}/>
                    <h4>{gettext("Export Type")}:</h4>
                    {this.getExportTypes()}
                    <h4>{gettext("Export Format")}:</h4>
                    <select name="export_format">
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                    <h4>{gettext("Export Method")}:</h4>
                    <select
                        name="export_method"
                        value={this.state.export_method}
                        onChange={(e) => this.setState({ export_method: e.target.value })}
                    >
                        <option value="email">{gettext("Email")}</option>
                        <option value="download">{gettext("Download")}</option>
                    </select>
                    {object_sets}
                    <input type="hidden" id="objectID" name="objectID" value={JSON.stringify(this.props.data.id)}/>
                    <input type="hidden" id="objectType" name="objectType" value={JSON.stringify(this.props.data.type)}/>
                    <input id="submit-button" type="submit"/>
                </form>
                {jobs.length === 0 ? (
                    <p>{gettext("No export jobs found.")}</p>
                ) : (<>
                    <h2>Your Export Jobs</h2>
                    <p>{gettext("Note: you may have a maximum of 3 export jobs at once. Items in excess of this limit will be deleted. Export jobs are deleted after 24 hours.")}</p>
                    <div class="export-jobs">
                    {jobs.map((job) => (
                        <div class="export-item" key={job.job_id}>
                            <strong>{job.object_type} {job.object_id}</strong> — {job.export_type} — <span>{gettext("Created")}: {new Date(job.created).toISOString().split('.')[0].replace('T', ' ')}</span> — <em>{job.status}</em>                     
                            {job.status === 'success' && (
                            <span class="material-symbols-rounded hover-shade" onClick={() => getExportDownload(job.filename)}>
                                download
                            </span>
                            )}
                            {job.status === 'error' && (
                            <span>{gettext("with error: ")+job.error}</span>
                            )}
                        </div>
                    )
                    )}
                    </div>
                    </>
                )}
                <iframe hidden name="redirect-iframe" id='redirect-iframe'></iframe>
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
    }

    getExportTypes(){
        let type = this.props.data.type;
        let exports=[];
        exports.push(
            [<input name="export_type" type="radio" value="outcome" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="outcome"}/>,<label for="export_type">{gettext("Outcomes")}</label>]
        );
        exports.push(
            [<input name="export_type" type="radio" value="node" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="node"}/>,<label for="export_type">{gettext("Nodes")}</label>]
        );
        if(type=="project"||type=="course")exports.push(
            [<input name="export_type" type="radio" value="framework" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="framework"}/>,<label for="export_type">{gettext("Course Framework")}</label>]
        );
        if(type=="project"||type=="program")exports.push(
            [<input name="export_type" type="radio" value="matrix" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="matrix"}/>,<label for="export_type">{gettext("Competency Matrix")}</label>]
        );
        if(type=="project"||type=="program")exports.push(
            [<input name="export_type" type="radio" value="sobec" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="sobec"}/>,<label for="export_type">{gettext("Sobec Validation")}</label>]
        );
        if(type=="program")exports.push(
            [<input name="export_type" type="radio" value="excel" onChange={this.inputChange.bind(this,"type","")} checked={this.state.type=="excel"}/>,<label for="export_type">{gettext("Program Analytics Export")}</label>]
        );


        return exports;
    }

    inputChange(type,id,evt){
        if(type=="set"){
            let new_state={};
            new_state[id]=!evt.target.checked;
            this.setState(new_state);
        }else if(type=="type" && evt.target.checked){
            this.setState({type:evt.target.value});
        }
    }

    submit(evt){
        $("#submit-button").attr("disabled",true);
        setTimeout(()=>{
            if(this.state.export_method=="download"){
                alert(gettext("Your file is being generated, check back later for its status."));
                this.fetchJobs();
            }else{
                this.props.actionFunction();
                alert(gettext("Your file is being generated and will be emailed to you shortly."));
            }
        },1000);
        return true;
    }

    fetchJobs(){
        checkExportStatus((data) => {
            if (data?.jobs) {
                const sortedJobs = data.jobs.sort((a, b) => new Date(b.created) - new Date(a.created));
                this.setState({ jobs: data.jobs });
            }
        });
    }


}
