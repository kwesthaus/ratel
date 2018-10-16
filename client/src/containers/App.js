import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import URLSearchParams from "url-search-params";

import PanelLayout from "../components/PanelLayout";
import Schema from "../components/Schema";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarFeedback from "../components/SidebarFeedback";
import EditorPanel from "../components/EditorPanel";
import FrameList from "../components/FrameList";
import SidebarUpdateUrl from "../components/SidebarUpdateUrl";

import { createCookie, readCookie, eraseCookie } from "../lib/helpers";
import { runQuery, runQueryByShareId } from "../actions";
import {
    refreshConnectedState,
    updateConnectedState,
    updateShouldPrompt,
} from "../actions/connection";
import {
    discardFrame,
    discardAllFrames,
    toggleCollapseFrame,
    updateFrame,
} from "../actions/frames";
import {
    updateQuery,
    updateAction,
    updateQueryAndAction,
} from "../actions/query";
import { updateUrl } from "../actions/url";

import "../assets/css/App.scss";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.panelLayout = React.createRef();

        this.state = {
            // IDEA: Make this state a part of <Sidebar /> to avoid rerendering whole <App />.
            overlayUrl: null,
            mainFrameUrl: "schema",
            // queryExecutionCounter is used to determine when the NPS score survey
            // should be shown.
            queryExecutionCounter: 0,
        };
    }

    async componentDidMount() {
        const { handleRefreshConnectedState, location } = this.props;

        handleRefreshConnectedState(this.openChangeUrlModal);

        const queryParams = new URLSearchParams(location.search);
        const shareId = queryParams && queryParams.get("shareId");
        if (shareId) {
            this.onRunSharedQuery(shareId);
        }
    }

    handeUpdateUrlAndRefresh = url => {
        const {
            handleRefreshConnectedState,
            handleUpdateShouldPrompt,
            _handleUpdateUrl,
        } = this.props;

        _handleUpdateUrl(url);
        handleUpdateShouldPrompt();
        handleRefreshConnectedState();
        this.handleToggleSidebarMenu("");
    };

    isMainFrameUrl = sidebarMenu => ["", "schema"].indexOf(sidebarMenu) >= 0;

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "feedback") {
            return <SidebarFeedback />;
        }
        if (overlayUrl === "connection") {
            const { url } = this.props;
            return (
                <SidebarUpdateUrl
                    url={url}
                    onSubmit={this.handeUpdateUrlAndRefresh}
                    onCancel={() => this.handleToggleSidebarMenu("")}
                />
            );
        }
        return null;
    };

    handleToggleSidebarMenu = targetMenu => {
        if (this.isMainFrameUrl(targetMenu)) {
            this.setState({
                overlayUrl: null,
                mainFrameUrl: targetMenu,
            });
        } else {
            this.setState({
                // Second click on the same overlay button closes it.
                overlayUrl:
                    targetMenu === this.state.overlayUrl ? null : targetMenu,
            });
        }
    };

    // saveCodeMirrorInstance saves the codemirror instance initialized in the
    // <Editor /> component so that we can access it in this component. (e.g. to
    // focus).
    saveCodeMirrorInstance = codemirror => {
        this._codemirror = codemirror;
    };

    handleUpdateQuery = (val, done = () => {}) => {
        const { _handleUpdateQuery } = this.props;

        _handleUpdateQuery(val);
        done();
    };

    handleUpdateAction = action => {
        const { _handleUpdateAction } = this.props;

        _handleUpdateAction(action);
    };

    // focusCodemirror sets focus on codemirror and moves the cursor to the end.
    focusCodemirror = () => {
        const cm = this._codemirror;
        const lastlineNumber = cm.doc.lastLine();
        const lastCharPos = cm.doc.getLine(lastlineNumber).length;

        cm.focus();
        cm.setCursor({ line: lastlineNumber, ch: lastCharPos });
    };

    handleSelectQuery = (query, action) => {
        const { _handleUpdateQueryAndAction } = this.props;

        _handleUpdateQueryAndAction(query, action);
        this.focusCodemirror();
    };

    handleClearQuery = () => {
        this.handleUpdateQuery("", this.focusCodemirror);
    };

    collapseAllFrames = () => {
        const { frames, handleCollapseFrame } = this.props;

        frames.forEach(handleCollapseFrame);
    };

    handleRunQuery = (query, action) => {
        // First, collapse all frames in order to prevent slow rendering.
        // FIXME: This won't be necessary if visualization took up less resources.
        // TODO: Compare benchmarks between d3.js and vis.js and make migration if needed.
        this.collapseAllFrames();
        this.panelLayout.current.scrollSecondToTop();

        this.props._dispatchRunQuery(query, action);
    };

    handleDiscardAllFrames = () => {
        const { _handleDiscardAllFrames } = this.props;

        _handleDiscardAllFrames();
    };

    onRunSharedQuery = shareId => {
        const { handleRunSharedQuery } = this.props;

        handleRunSharedQuery(shareId);
    };

    openChangeUrlModal = () => {
        this.handleToggleSidebarMenu("connection");
    };

    render() {
        const { mainFrameUrl, overlayUrl } = this.state;
        const {
            handleRefreshConnectedState,
            handleDiscardFrame,
            handleUpdateConnectedState,
            frames,
            framesTab,
            connection,
            url,
            updateFrame,
        } = this.props;

        const canDiscardAll = frames.length > 0;

        let mainFrameContent;
        if (mainFrameUrl === "") {
            mainFrameContent = (
                <div style={{ padding: "0 15px", width: "100%" }}>
                    <h2>Console</h2>

                    <PanelLayout
                        ref={this.panelLayout}
                        first={
                            <EditorPanel
                                canDiscardAll={canDiscardAll}
                                onDiscardAllFrames={this.handleDiscardAllFrames}
                                onRunQuery={this.handleRunQuery}
                                onClearQuery={this.handleClearQuery}
                                saveCodeMirrorInstance={
                                    this.saveCodeMirrorInstance
                                }
                                connection={connection}
                                url={url}
                                onUpdateQuery={this.handleUpdateQuery}
                                onUpdateAction={this.handleUpdateAction}
                                onUpdateConnectedState={
                                    handleUpdateConnectedState
                                }
                                onRefreshConnectedState={
                                    handleRefreshConnectedState
                                }
                            />
                        }
                        second={
                            <FrameList
                                frames={frames}
                                framesTab={framesTab}
                                onDiscardFrame={handleDiscardFrame}
                                onSelectQuery={this.handleSelectQuery}
                                onUpdateConnectedState={
                                    handleUpdateConnectedState
                                }
                                collapseAllFrames={this.collapseAllFrames}
                                updateFrame={updateFrame}
                                url={url}
                            />
                        }
                    />
                </div>
            );
        } else if (mainFrameUrl === "schema") {
            mainFrameContent = (
                <Schema
                    url={url}
                    onUpdateConnectedState={handleUpdateConnectedState}
                />
            );
        }

        return (
            <div className="app-layout">
                <Sidebar
                    currentMenu={overlayUrl || mainFrameUrl}
                    currentOverlay={this.getOverlayContent(overlayUrl)}
                    onToggleMenu={this.handleToggleSidebarMenu}
                    connection={connection}
                    serverName={url.url}
                />
                <div
                    className={classnames("main-content", {
                        schema: mainFrameUrl === "schema",
                    })}
                >
                    {overlayUrl ? (
                        <div
                            className="click-capture"
                            onClick={e => {
                                e.stopPropagation();
                                this.setState({
                                    overlayUrl: null,
                                });
                            }}
                        />
                    ) : null}
                    {mainFrameContent}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        frames: state.frames.items,
        framesTab: state.frames.tab,
        connection: state.connection,
        url: state.url,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        _dispatchRunQuery(query, action) {
            return dispatch(runQuery(query, action));
        },
        _handleDiscardAllFrames() {
            return dispatch(discardAllFrames());
        },
        handleRefreshConnectedState(openChangeUrlModal) {
            dispatch(refreshConnectedState(openChangeUrlModal));
        },
        handleRunSharedQuery(shareId) {
            return dispatch(runQueryByShareId(shareId));
        },
        handleDiscardFrame(frameID) {
            dispatch(discardFrame(frameID));
        },
        handleCollapseFrame(frame) {
            dispatch(toggleCollapseFrame(frame, true));
        },
        handleUpdateConnectedState(nextState) {
            dispatch(updateConnectedState(nextState));
        },
        handleUpdateShouldPrompt() {
            dispatch(updateShouldPrompt());
        },
        _handleUpdateQuery(query) {
            dispatch(updateQuery(query));
        },
        _handleUpdateAction(action) {
            dispatch(updateAction(action));
        },
        _handleUpdateQueryAndAction(query, action) {
            dispatch(updateQueryAndAction(query, action));
        },
        updateFrame(frame) {
            dispatch(updateFrame(frame));
        },
        _handleUpdateUrl(url) {
            dispatch(updateUrl(url));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(App);
