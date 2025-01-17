const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const legend = document.getElementById('legend');
const legendItems = document.getElementById('legend-items');
const toggleGroupingButton = document.getElementById('toggle-grouping');
const toggleLegendButton = document.getElementById('toggle-legend');

const nodes = [
    { id: 'A', label: 'Race Information System', category: 'Data Sources' },
    { id: 'G', label: 'Qualifying Event Data', category: 'Data Sources' },
    { id: 'B', label: 'Pulsar', category: 'Data Processing' },
    { id: 'Q', label: 'RACC Truck', category: 'Data Sources' },
    { id: 'C', label: 'Data Processing Pipeline', category: 'Data Processing' },
    { id: 'H', label: '2023 Tire Model', category: 'Data Processing' },
    { id: 'I', label: 'User Configuration', category: 'User Configuration & Machine Learning' },
    { id: 'D', label: 'Yellow Flag Prediction App', category: 'Core Applications' },
    { id: 'E', label: 'Tire Degradation Model App', category: 'Core Applications' },
    { id: 'F', label: 'Pre-Race Strategy Optimization', category: 'Core Applications' },
    { id: 'J', label: 'MLFlow', category: 'User Configuration & Machine Learning' },
    { id: 'L', label: 'Orquestra', category: 'User Configuration & Machine Learning' },
    { id: 'M', label: 'Dashboard', category: 'Output' },
    { id: 'K', label: 'Dremio', category: 'User Configuration & Machine Learning' },
    { id: 'N', label: 'Video Recording', category: 'Feedback Loop' },
    { id: 'O', label: 'Post-Race Analysis', category: 'Feedback Loop' },
    { id: 'P', label: 'Andretti Race Strategy Team', category: 'Feedback Loop' }
];

const edges = [
    { from: 'A', to: 'B' }, { from: 'G', to: 'B' }, { from: 'B', to: 'C' },
    { from: 'C', to: 'D' }, { from: 'C', to: 'E' }, { from: 'C', to: 'F' },
    { from: 'H', to: 'F' }, { from: 'I', to: 'F' }, { from: 'J', to: 'D' },
    { from: 'J', to: 'E' }, { from: 'K', to: 'J' }, { from: 'L', to: 'J' },
    { from: 'L', to: 'K' }, { from: 'M', to: 'D' }, { from: 'M', to: 'E' },
    { from: 'M', to: 'F' }, { from: 'N', to: 'M' }, { from: 'O', to: 'D' },
    { from: 'O', to: 'E' }, { from: 'O', to: 'F' }, { from: 'P', to: 'O' },
    { from: 'P', to: 'F' }, { from: 'Q', to: 'B' }, { from: 'Q', to: 'C' },
    { from: 'Q', to: 'D' }, { from: 'Q', to: 'E' }, { from: 'Q', to: 'F' },
    { from: 'Q', to: 'M' }
];

const categoryColors = {
    'Data Sources': '#ff6666',
    'Data Processing': '#66b2ff',
    'User Configuration & Machine Learning': '#ffff66',
    'Core Applications': '#66ff66',
    'Output': '#ffb266',
    'Feedback Loop': '#b266ff',
};

let isGrouped = false;
let isLegendVisible = true;
let groups = {};
let collapsedGroups = {};
let draggedNode = null;
let draggedGroup = null;
let dragStartX, dragStartY;

const initializeNodes = () => {
    const padding = 10;
    ctx.font = '12px Arial';
    nodes.forEach(node => {
        const textWidth = ctx.measureText(node.label).width;
        node.width = textWidth + 2 * padding;
        node.height = 30;
        node.x = Math.random() * (canvas.width - node.width);
        node.y = Math.random() * (canvas.height - node.height);
    });
}

const drawNode = node => {
    if (collapsedGroups[node.category]) return;
    ctx.fillStyle = categoryColors[node.category];
    ctx.fillRect(node.x, node.y, node.width, node.height);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(node.x, node.y, node.width, node.height);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x + node.width / 2, node.y + node.height / 2);
}

const drawEdge = edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to || collapsedGroups[from.category] || collapsedGroups[to.category]) return;
    const headlen = 10; // length of head in pixels
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x + from.width / 2, from.y + from.height / 2);
    ctx.lineTo(to.x + to.width / 2, to.y + to.height / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x + to.width / 2, to.y + to.height / 2);
    ctx.lineTo(to.x + to.width / 2 - headlen * Math.cos(angle - Math.PI / 6), to.y + to.height / 2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x + to.width / 2 - headlen * Math.cos(angle + Math.PI / 6), to.y + to.height / 2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(to.x + to.width / 2, to.y + to.height / 2);
    ctx.lineTo(to.x + to.width / 2 - headlen * Math.cos(angle - Math.PI / 6), to.y + to.height / 2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
}

const drawGroups = () => {
    if (!isGrouped) return;
    Object.entries(groups).forEach(([category, groupNodes]) => {
        if (groupNodes.length === 0) return;
        const padding = 20;
        const minX = Math.min(...groupNodes.map(n => n.x)) - padding;
        const minY = Math.min(...groupNodes.map(n => n.y)) - padding;
        const maxX = Math.max(...groupNodes.map(n => n.x + n.width)) + padding;
        const maxY = Math.max(...groupNodes.map(n => n.y + n.height)) + padding;
        ctx.strokeStyle = categoryColors[category];
        ctx.lineWidth = 2;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.fillStyle = categoryColors[category];
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const textWidth = ctx.measureText(category).width;
        const textX = Math.max(minX + 5, Math.min(minX + 5, maxX - textWidth - 5));
        const textY = Math.max(minY + 5, Math.min(minY + 5, maxY - 20));
        ctx.fillText(category, textX, textY);

        // Draw toggle arrow
        const arrow = collapsedGroups[category] ? '▶' : '▼';
        ctx.fillText(arrow, textX + textWidth + 10, textY);
    });
}

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGroups();
    edges.forEach(drawEdge);
    nodes.forEach(drawNode);
}

const updateGroups = () => {
    groups = {};
    Object.keys(categoryColors).forEach(category => {
        groups[category] = nodes.filter(node => node.category === category);
    });

    if (isGrouped) {
        const orderedGroups = topologicalSortGroups(groups, edges);
        arrangeGroups(orderedGroups);
    }
}

const populateLegend = () => {
    legendItems.innerHTML = '';
    Object.entries(categoryColors).forEach(([category, color]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="color-box" style="background-color: ${color};"></div>
            <span>${category}</span>
            <span class="group-toggle" onclick="toggleGroup('${category}')">${collapsedGroups[category] ? '▶' : '▼'}</span>
        `;
        legendItems.appendChild(item);
    });
}

const getGroupAtPosition = (x, y) => {
    if (!isGrouped) return null;
    for (const [category, groupNodes] of Object.entries(groups)) {
        if (groupNodes.length === 0) continue;
        const padding = 20;
        const minX = Math.min(...groupNodes.map(n => n.x)) - padding;
        const minY = Math.min(...groupNodes.map(n => n.y)) - padding;
        const maxX = Math.max(...groupNodes.map(n => n.x + n.width)) + padding;
        const maxY = Math.max(...groupNodes.map(n => n.y + n.height)) + padding;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return category;
        }
    }
    return null;
}

const toggleGroup = category => {
    collapsedGroups[category] = !collapsedGroups[category];
    draw();
    populateLegend();
}

const topologicalSortGroups = (groups, edges) => {
    const inDegree = new Map();
    const graph = new Map();
    Object.keys(groups).forEach(category => {
        inDegree.set(category, 0);
        graph.set(category, []);
    });

    edges.forEach(edge => {
        const fromNode = nodes.find(node => node.id === edge.from);
        const toNode = nodes.find(node => node.id === edge.to);
        if (fromNode && toNode && fromNode.category !== toNode.category) {
            graph.get(fromNode.category).push(toNode.category);
            inDegree.set(toNode.category, inDegree.get(toNode.category) + 1);
        }
    });

    const queue = [];
    inDegree.forEach((degree, category) => {
        if (degree === 0) queue.push(category);
    });

    const sortedCategories = [];
    while (queue.length > 0) {
        const category = queue.shift();
        sortedCategories.push(category);
        graph.get(category).forEach(neighborCategory => {
            inDegree.set(neighborCategory, inDegree.get(neighborCategory) - 1);
            if (inDegree.get(neighborCategory) === 0) queue.push(neighborCategory);
        });
    }
    return sortedCategories.map(category => groups[category]);
}

const arrangeGroups = orderedGroups => {
    const padding = 50;
    const startX = 50;
    const startY = 50;
    let currentX = startX;

    orderedGroups.forEach(groupNodes => {
        let currentY = startY;
        let maxWidth = 0;

        // Sort nodes within the group by height
        groupNodes.sort((a, b) => b.height - a.height);

        groupNodes.forEach(node => {
            node.x = currentX;
            node.y = currentY;
            currentY += node.height + padding;
            maxWidth = Math.max(maxWidth, node.width);
        });

        // Adjust positions to center nodes within the group
        const groupHeight = currentY - startY - padding;
        const centerY = startY + groupHeight / 2;
        groupNodes.forEach(node => {
            node.y += centerY - (groupHeight / 2 + startY);
            node.x += (maxWidth - node.width) / 2;
        });

        currentX += maxWidth + padding * 2; // Add extra padding between groups
    });
}


canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    draggedNode = nodes.find(node => 
        mouseX >= node.x && mouseX <= node.x + node.width &&
        mouseY >= node.y && mouseY <= node.y + node.height
    );
    if (!draggedNode && isGrouped) {
        draggedGroup = getGroupAtPosition(mouseX, mouseY);
    }
    if (draggedNode || draggedGroup) {
        canvas.style.cursor = 'grabbing';
        dragStartX = mouseX;
        dragStartY = mouseY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (draggedNode) {
        draggedNode.x = mouseX - draggedNode.width / 2;
        draggedNode.y = mouseY - draggedNode.height / 2;
        updateGroups();
        draw();
    } else if (draggedGroup) {
        const dx = mouseX - dragStartX;
        const dy = mouseY - dragStartY;
        groups[draggedGroup].forEach(node => {
            node.x += dx;
            node.y += dy;
        });
        dragStartX = mouseX;
        dragStartY = mouseY;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggedNode || draggedGroup) {
        canvas.style.cursor = 'move';
        draggedNode = null;
        draggedGroup = null;
    }
});

toggleGroupingButton.addEventListener('click', () => {
    isGrouped = !isGrouped;
    toggleGroupingButton.textContent = isGrouped ? 'Disable Grouping' : 'Enable Grouping';
    updateGroups();
    draw();
});

toggleLegendButton.addEventListener('click', () => {
    isLegendVisible = !isLegendVisible;
    legend.style.display = isLegendVisible ? 'block' : 'none';
    toggleLegendButton.textContent = isLegendVisible ? 'Hide Legend' : 'Show Legend';
});

initializeNodes();
updateGroups();
populateLegend();
draw();

