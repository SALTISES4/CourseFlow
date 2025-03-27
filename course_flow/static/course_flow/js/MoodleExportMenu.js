import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {getMoodleJsonData} from "./PostFunctions";
import {Loader} from "./Constants";

export class MoodleExportMenu extends React.Component{
    constructor(props){
        super(props);
        this.state = {json:null};
    }

    render(){
        console.log(this.props);
        let json_link = window.location+"get-public-moodle-json/"

        let json_button;
        if(this.state.json){
            json_button = (
                <div id="moodle-json-copy" class="public-link-button hover-shade" onClick = {()=>{
                    navigator.clipboard.writeText(this.state.json);
                    let copy_icon_text = $("#moodle-json-copy .copy-link-icon .material-symbols-rounded").text();
                    let copy_description_text = $("#moodle-json-copy .copy-link-text").text();
                    $("#moodle-json-copy .copy-link-icon .material-symbols-rounded").text("done");
                    $("#moodle-json-copy .copy-link-text").text("Copied to Clipboard");
                    setTimeout(()=>{
                        $("#moodle-json-copy .copy-link-icon .material-symbols-rounded").text(copy_icon_text);
                        $("#moodle-json-copy .copy-link-text").text(copy_description_text);
                    },1000)
                }}>
                    <div class="copy-link-icon"><span class="material-symbols-rounded">link</span></div>
                    <div>
                        <div class="copy-link-text">{gettext("Copy JSON")}</div>
                        <div class="public-link-description">{gettext("Paste this JSON data into Moodle when asked by the plugin.")}</div>
                    </div>
                </div>
            );
        }else{
            json_button = (
                <button class="primary-button" id="generate-json" onClick={this.fetch_json.bind(this)}>{gettext("Generate JSON")}</button>
            );
        }

        let url_import;
        if(this.props.data.public_view){
            url_import = [
                <p>{gettext("Your import URL is:")}</p>,
                <input type="text" value={json_link} style={{width:"100%"}} readonly={true}/>,
                <div id="moodle-url-copy" class="public-link-button hover-shade" onClick = {()=>{
                    navigator.clipboard.writeText(json_link);
                    let copy_icon_text = $("#moodle-url-copy .copy-link-icon .material-symbols-rounded").text();
                    let copy_description_text = $("#moodle-url-copy .copy-link-text").text();
                    $("#moodle-url-copy .copy-link-icon .material-symbols-rounded").text("done");
                    $("#moodle-url-copy .copy-link-text").text("Copied to Clipboard");
                    setTimeout(()=>{
                        $("#moodle-url-copy .copy-link-icon .material-symbols-rounded").text(copy_icon_text);
                        $("#moodle-url-copy .copy-link-text").text(copy_description_text);
                    },1000)
                }}>
                    <div class="copy-link-icon"><span class="material-symbols-rounded">link</span></div>
                    <div>
                        <div class="copy-link-text">{gettext("Copy URL")}</div>
                        <div class="public-link-description">{gettext("Paste this URL into Moodle when asked by the plugin.")}</div>
                    </div>
                </div>
            ]

        }else{
            url_import = (
                <p>{gettext("Warning: Your workflow is not public. You will not be able to import to the Moodle plugin from a URL. Visit the 'Sharing' menu to change this.")}</p>
            );
        }

        return(
            <div class="message-wrap">
                <h2>{gettext("Moodle Plugin Information")}</h2>
                <p>{gettext("The following menu is for use with the Moodle CourseFlowTool plugin. The plugin must be installed on your Moodle server in order to use this feature. Please see")} <a href='https://moodle.org/plugins/local_courseflowtool'>https://moodle.org/plugins/local_courseflowtool</a> {gettext("for more information.")}</p>
                <p>{gettext("There are two methods you may use to import CourseFlow data into Moodle: via URL or by copy-pasting JSON data. Using the URL requires that you generate a public link to your workflow (see the options under 'Sharing').")}</p>
                <h3>{gettext("Generate From URL:")}</h3>
                
                {url_import}

                <h3>{gettext("Generate From JSON:")}</h3>

                <textarea disabled={true} value={this.state.json} readonly={true}/>
                {json_button}
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
    }

    fetch_json(){
        console.log("going to fetch json");
        let component = this;
        getMoodleJsonData(
            this.props.data.id,
            response_data => component.setState({
                json:JSON.stringify(response_data.data_package)
            })
        );
    }

}
