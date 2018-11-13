import React from "react";

import NodeProperties from "../components/NodeProperties";
import PartialRenderInfo from "../components/PartialRenderInfo";

import D3Graph from "../components/D3Graph";

import "../assets/css/Graph.scss";

class GraphContainer extends React.Component {
    render() {
        const {
            onExpandNode,
            onExpandResponse,
            onNodeHovered,
            onNodeSelected,
            parsedResponse,
        } = this.props;

        const { nodesDataset, edgesDataset } = this.props;

        const canToggleExpand = parsedResponse.remainingNodes > 0;

        return (
            <div className="graph-container">
                <D3Graph
                    nodes={nodesDataset}
                    edges={edgesDataset}
                    onNodeHovered={onNodeHovered}
                    onNodeSelected={onNodeSelected}
                    onNodeDoubleClicked={node => onExpandNode(node.uid)}
                />
                <PartialRenderInfo
                    canExpand={canToggleExpand}
                    remainingNodes={parsedResponse.remainingNodes}
                    onExpandNetwork={onExpandResponse}
                />
                {this.props.selectedNode ? (
                    <NodeProperties
                        node={this.props.selectedNode}
                        onExpandNode={onExpandNode}
                    />
                ) : null}
            </div>
        );
    }
}

export default GraphContainer;
