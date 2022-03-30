import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList} from "./PostFunctions";
import {Loader} from "./Constants";

export class ExportMenu extends React.Component{
    constructor(props){
        super(props);
    }
    
    render(){
        console.log(this.props);
        
        let object_sets;
        if(this.props.data.object_sets.length>0){
            object_sets = (
                [<h4>{gettext("Object Set Visibility")}:</h4>,
                this.props.data.object_sets.map(objectset=>
                    <div>
                        <input name="object_sets[]" value={objectset.id} type="checkbox" id={objectset.id} checked/><label>{objectset.title}</label>
                    </div>
                )
                ]
            )
        }
        
        return(
            <div class="message-wrap">
                <h3>{gettext("Export Files")+":"}</h3>
                <p>{gettext("Use this menu to export files.")}</p>
                <form  enctype="multipart/form-data" action={post_paths.get_export} method="POST" id="export-form" target="redirect-iframe" onSubmit={this.submit.bind(this)}>
                    <input type="hidden" name="csrfmiddlewaretoken" value={root.getCsrfToken()}/>
                    <h4>{gettext("Export Type")}:</h4>
                    <input name="export_type" type="radio" value="outcome" checked/><label for="export_type">{gettext("Outcomes")}</label>
                    <input name="export_type" type="radio" value="node"/><label for="export_type">{gettext("Nodes")}</label>
                    <input name="export_type" type="radio" value="framework"/><label for="export_type">{gettext("Course Framework")}</label>
                    <input name="export_type" type="radio" value="matrix"/><label for="export_type">{gettext("Competency Matrix")}</label>
                    <h4>{gettext("Export Format")}:</h4>
                    <select name="export_format">
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                    {object_sets}
                    <input type="hidden" id="objectID" name="objectID" value={JSON.stringify(this.props.data.id)}/>
                    <input type="hidden" id="objectType" name="objectType" value={JSON.stringify(this.props.data.type)}/>
                    <input id="submit-button" type="submit"/>
                </form>
                <iframe hidden name="redirect-iframe" id='redirect-iframe'></iframe>
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
    }
    
    submit(evt){
        $("#submit-button").attr("disabled",true);
        setTimeout(()=>{
            this.props.actionFunction();
            alert(gettext("Your file is being generated and will be emailed to you shortly."));
        },100);
        return true;
    }
    
}
