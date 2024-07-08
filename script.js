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
        const minY = Math.min(...group
