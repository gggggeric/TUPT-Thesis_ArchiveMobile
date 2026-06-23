import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, RefreshControl, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
    Path, Circle, Defs, LinearGradient as SvgLinearGradient,
    Stop, Line, G, Text as SvgText
} from 'react-native-svg';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import BottomNavBar from '../Navigation/BottomNavBar';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const { width } = Dimensions.get('window');

const AdminDashboard = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // States for dashboard stats and activities
    const [stats, setStats] = useState({
        theses: 0,
        users: 0,
        pending: 0,
        graduated: 0,
        collaborations: 0
    });
    const [chartData, setChartData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    
    // Interactive graph states
    const [selectedGrowthMonth, setSelectedGrowthMonth] = useState(null);
    const [selectedInteractionMonth, setSelectedInteractionMonth] = useState(null);

    useEffect(() => {
        if (isFocused) {
            fetchDashboardData();
        }
    }, [isFocused]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setLoading(false);
                return;
            }
            const headers = { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Fetch Stats
            const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.data);
                    if (statsData.data.chartData) {
                        setChartData(statsData.data.chartData);
                        // Default selection to the last month
                        const len = statsData.data.chartData.length;
                        if (len > 0) {
                            setSelectedGrowthMonth(statsData.data.chartData[len - 1]);
                            setSelectedInteractionMonth(statsData.data.chartData[len - 1]);
                        }
                    }
                }
            }

            // Fetch Recent Theses
            const thesesRes = await fetch(`${API_BASE_URL}/admin/theses`, { headers });
            if (thesesRes.ok) {
                const thesesData = await thesesRes.json();
                if (thesesData.success) {
                    setRecentActivity(thesesData.data.slice(0, 5));
                }
            }
        } catch (err) {
            console.error('Error fetching admin dashboard:', err);
            Alert.alert('Error', 'Failed to load system overview stats.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SmartSearch', { initialQuery: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    // Chart Dimensions
    const svgWidth = width - 80; // Card width is width - 40 (horizontal padding), inner content has 20 padding each side.
    const svgHeight = 200;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;
    const graphWidth = svgWidth - paddingLeft - paddingRight;
    const graphHeight = svgHeight - paddingTop - paddingBottom;

    // Helper functions for scaling coordinate positions
    const getX = (index) => paddingLeft + index * (graphWidth / Math.max(1, chartData.length - 1));
    const getY = (val, maxVal) => paddingTop + graphHeight - (((val || 0) / Math.max(maxVal, 1)) * graphHeight);

    // Bezier path generator for smooth curves
    const getBezierPath = (pts) => {
        if (pts.length === 0) return '';
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        let path = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 3;
            const cp1y = p0.y;
            const cp2x = p1.x - (p1.x - p0.x) / 3;
            const cp2y = p1.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
        return path;
    };

    // Closed path generator for smooth area gradients
    const getAreaPath = (pts, bottomY) => {
        if (pts.length === 0) return '';
        const curve = getBezierPath(pts);
        return `${curve} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;
    };

    // Calculate maximum values for relative chart coordinates
    const maxGrowthVal = Math.max(...chartData.map(d => Math.max(d.users || 0, d.theses || 0)), 1);
    const maxInteractionVal = Math.max(...chartData.map(d => Math.max(d.collaborations || 0, d.history || 0)), 1);

    // Distribution calculations
    const alumniVal = stats.graduated || 0;
    const studentVal = Math.max(0, (stats.users || 0) - alumniVal);
    const totalVal = alumniVal + studentVal;
    const alumniPct = totalVal > 0 ? Math.round((alumniVal / totalVal) * 100) : 0;
    const studentPct = totalVal > 0 ? 100 - alumniPct : 0;

    // Donut circle math
    const donutRadius = 50;
    const donutCx = 70;
    const donutCy = 70;
    const donutStrokeWidth = 14;
    const donutCircumference = 2 * Math.PI * donutRadius;
    const donutGap = totalVal > 0 && alumniVal > 0 && studentVal > 0 ? 8 : 0;
    const donutAvail = donutCircumference - (donutGap > 0 ? 2 * donutGap : 0);

    const donutAlumniLen = totalVal > 0 ? (alumniVal / totalVal) * donutAvail : 0;
    const donutStudentLen = totalVal > 0 ? (studentVal / totalVal) * donutAvail : 0;

    // Helper to generate grid tick lines
    const getTicks = (maxVal) => {
        const count = 4;
        const ticks = [];
        for (let i = 0; i <= count; i++) {
            ticks.push(Math.round((maxVal / count) * i));
        }
        return ticks.reverse(); // Display highest tick at the top
    };

    return (
        <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.container}>
            <CustomHeader
                showSearch={false}
            />

            {/* Grid Menu */}
            {isFocused && (
                <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />
            )}

            {loading && !refreshing ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Synchronizing archive overview...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} 
                            tintColor={Colors.primary} 
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerBar} />
                            <View>
                                <Text style={styles.headerTag}>SYSTEM MONITOR</Text>
                                <Text style={styles.headerTitle}>Overview Portal</Text>
                            </View>
                        </View>
                        <View style={styles.adminBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    </View>

                    {/* Admin Warning/Notice Box */}
                    <View style={styles.noticeBox}>
                        <Ionicons name="warning-outline" size={18} color="#fbbf24" style={{ marginTop: 2 }} />
                        <Text style={styles.noticeText}>
                            For proper handling of data, use the web version if you are going to edit, delete, or update files.
                        </Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <TouchableOpacity 
                            style={styles.statsCard} 
                            onPress={() => navigation.navigate('ManageTheses', { status: 'all' })}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: `${Colors.primary}10`, borderColor: `${Colors.primary}30` }]}>
                                <Ionicons name="document-text" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.statVal}>{stats.theses.toLocaleString()}</Text>
                            <Text style={styles.statLbl}>TOTAL THESES</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.statsCard}
                            onPress={() => navigation.navigate('ManageUsers')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                                <Ionicons name="people" size={20} color="#3b82f6" />
                            </View>
                            <Text style={stats.users > 9999 ? [styles.statVal, { fontSize: 20 }] : styles.statVal}>{stats.users.toLocaleString()}</Text>
                            <Text style={styles.statLbl}>TOTAL USERS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.statsCard}
                            onPress={() => navigation.navigate('ManageCollaborations')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                                <Ionicons name="git-pull-request" size={20} color="#6366f1" />
                            </View>
                            <Text style={stats.collaborations > 9999 ? [styles.statVal, { fontSize: 20 }] : styles.statVal}>{stats.collaborations.toLocaleString()}</Text>
                            <Text style={styles.statLbl}>COLLABS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.statsCard}
                            onPress={() => navigation.navigate('ManageTheses', { status: 'pending' })}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }]}>
                                <Ionicons name="alert-circle" size={20} color="#fbbf24" />
                            </View>
                            <Text style={stats.pending > 9999 ? [styles.statVal, { fontSize: 20 }] : styles.statVal}>{stats.pending.toLocaleString()}</Text>
                            <Text style={styles.statLbl}>PENDING</Text>
                        </TouchableOpacity>
                    </View>

                    {/* System Growth Card */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View style={styles.headerTitleContainer}>
                                <View style={[styles.titleBar, { backgroundColor: Colors.primary }]} />
                                <Text style={styles.chartTitle}>SYSTEM GROWTH</Text>
                            </View>
                            <View style={styles.chartLegends}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: '#2dd4bf' }]} />
                                    <Text style={styles.legendText}>Theses</Text>
                                </View>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                                    <Text style={styles.legendText}>Users</Text>
                                </View>
                            </View>
                        </View>

                        {/* Selected Month Tooltip */}
                        {selectedGrowthMonth && (
                            <View style={styles.tooltipBox}>
                                <Text style={styles.tooltipMonth}>{selectedGrowthMonth.name} Statistics</Text>
                                <View style={styles.tooltipValues}>
                                    <View style={styles.tooltipItem}>
                                        <Ionicons name="document-text" size={14} color="#2dd4bf" style={{ marginRight: 6 }} />
                                        <Text style={styles.tooltipText}>Theses: <Text style={{ color: '#2dd4bf', fontWeight: 'black' }}>{selectedGrowthMonth.theses}</Text></Text>
                                    </View>
                                    <View style={styles.tooltipItem}>
                                        <Ionicons name="people" size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                                        <Text style={styles.tooltipText}>Users: <Text style={{ color: '#3b82f6', fontWeight: 'black' }}>{selectedGrowthMonth.users}</Text></Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* SVG Area Chart */}
                        {chartData.length > 0 ? (
                            <View style={styles.chartCanvasContainer}>
                                <Svg width={svgWidth} height={svgHeight}>
                                    <Defs>
                                        <SvgLinearGradient id="colorTheses" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                            <Stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                        </SvgLinearGradient>
                                        <SvgLinearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <Stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </SvgLinearGradient>
                                    </Defs>

                                    {/* Grid Tick Lines */}
                                    {getTicks(maxGrowthVal).map((tick, idx) => {
                                        const tickY = getY(tick, maxGrowthVal);
                                        return (
                                            <G key={idx}>
                                                <Line 
                                                    x1={paddingLeft} 
                                                    y1={tickY} 
                                                    x2={svgWidth - paddingRight} 
                                                    y2={tickY} 
                                                    stroke="rgba(255,255,255,0.03)" 
                                                    strokeDasharray="3 3" 
                                                />
                                                <SvgText
                                                    x={paddingLeft - 8}
                                                    y={tickY + 3}
                                                    fill="rgba(255,255,255,0.2)"
                                                    fontSize={9}
                                                    fontWeight="900"
                                                    textAnchor="end"
                                                >
                                                    {tick}
                                                </SvgText>
                                            </G>
                                        );
                                    })}

                                    {/* Month X Labels */}
                                    {chartData.map((d, i) => (
                                        <SvgText
                                            key={i}
                                            x={getX(i)}
                                            y={svgHeight - 6}
                                            fill="rgba(255,255,255,0.2)"
                                            fontSize={9}
                                            fontWeight="900"
                                            textAnchor="middle"
                                        >
                                            {d.name}
                                        </SvgText>
                                    ))}

                                    {/* Vertical highlight line for selected month */}
                                    {selectedGrowthMonth && (() => {
                                        const idx = chartData.findIndex(d => d.name === selectedGrowthMonth.name);
                                        if (idx !== -1) {
                                            const selX = getX(idx);
                                            return (
                                                <Line 
                                                    x1={selX} 
                                                    y1={paddingTop} 
                                                    x2={selX} 
                                                    y2={paddingTop + graphHeight} 
                                                    stroke="rgba(255,255,255,0.15)" 
                                                    strokeDasharray="4 4" 
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Filled Areas */}
                                    <Path
                                        d={getAreaPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.theses, maxGrowthVal) })), paddingTop + graphHeight)}
                                        fill="url(#colorTheses)"
                                    />
                                    <Path
                                        d={getAreaPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.users, maxGrowthVal) })), paddingTop + graphHeight)}
                                        fill="url(#colorUsers)"
                                    />

                                    {/* Smooth Strokes */}
                                    <Path
                                        d={getBezierPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.theses, maxGrowthVal) })))}
                                        fill="none"
                                        stroke="#2dd4bf"
                                        strokeWidth={3}
                                    />
                                    <Path
                                        d={getBezierPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.users, maxGrowthVal) })))}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                    />

                                    {/* Highlight active circles */}
                                    {selectedGrowthMonth && (() => {
                                        const idx = chartData.findIndex(d => d.name === selectedGrowthMonth.name);
                                        if (idx !== -1) {
                                            const selX = getX(idx);
                                            const yTheses = getY(selectedGrowthMonth.theses, maxGrowthVal);
                                            const yUsers = getY(selectedGrowthMonth.users, maxGrowthVal);
                                            return (
                                                <G>
                                                    <Circle cx={selX} cy={yTheses} r={5} fill="#2dd4bf" stroke="#fff" strokeWidth={1.5} />
                                                    <Circle cx={selX} cy={yUsers} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
                                                </G>
                                            );
                                        }
                                        return null;
                                    })()}
                                </Svg>

                                {/* Absolute Interactive Overlay Strips */}
                                <View style={[styles.chartOverlay, { left: paddingLeft, width: graphWidth, height: graphHeight, top: paddingTop }]}>
                                    {chartData.map((month, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.overlayStrip}
                                            activeOpacity={1}
                                            onPress={() => setSelectedGrowthMonth(month)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.chartEmpty}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        )}
                    </View>

                    {/* Distribution Card */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View style={styles.headerTitleContainer}>
                                <View style={[styles.titleBar, { backgroundColor: '#10b981' }]} />
                                <Text style={styles.chartTitle}>DISTRIBUTION</Text>
                            </View>
                        </View>

                        <View style={styles.donutContainer}>
                            {/* SVG Donut Ring */}
                            <Svg width={140} height={140} viewBox="0 0 140 140">
                                {totalVal === 0 ? (
                                    <Circle
                                        cx={donutCx}
                                        cy={donutCy}
                                        r={donutRadius}
                                        stroke="rgba(255, 255, 255, 0.05)"
                                        strokeWidth={donutStrokeWidth}
                                        fill="none"
                                    />
                                ) : (
                                    <>
                                        {/* Alumni Ring Segment */}
                                        {alumniVal > 0 && (
                                            <Circle
                                                cx={donutCx}
                                                cy={donutCy}
                                                r={donutRadius}
                                                stroke="#10b981"
                                                strokeWidth={donutStrokeWidth}
                                                strokeDasharray={`${donutAlumniLen} ${donutCircumference - donutAlumniLen}`}
                                                strokeDashoffset={0}
                                                fill="none"
                                                transform={`rotate(-90 ${donutCx} ${donutCy})`}
                                            />
                                        )}
                                        {/* Students Ring Segment */}
                                        {studentVal > 0 && (
                                            <Circle
                                                cx={donutCx}
                                                cy={donutCy}
                                                r={donutRadius}
                                                stroke="rgba(59, 130, 246, 0.3)"
                                                strokeWidth={donutStrokeWidth}
                                                strokeDasharray={`${donutStudentLen} ${donutCircumference - donutStudentLen}`}
                                                strokeDashoffset={alumniVal > 0 ? -(donutAlumniLen + donutGap) : 0}
                                                fill="none"
                                                transform={`rotate(-90 ${donutCx} ${donutCy})`}
                                            />
                                        )}
                                    </>
                                )}
                            </Svg>

                            {/* Legends */}
                            <View style={styles.donutLegends}>
                                <View style={styles.donutLegendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                                    <View style={styles.donutLegendTextContainer}>
                                        <Text style={styles.legendText}>ALUMNI</Text>
                                        <Text style={styles.legendValue}>{alumniPct}%</Text>
                                    </View>
                                </View>
                                <View style={styles.donutLegendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: 'rgba(59, 130, 246, 0.5)' }]} />
                                    <View style={styles.donutLegendTextContainer}>
                                        <Text style={styles.legendText}>STUDENTS</Text>
                                        <Text style={styles.legendValue}>{studentPct}%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Interaction Analytics Card */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View style={styles.headerTitleContainer}>
                                <View style={[styles.titleBar, { backgroundColor: '#6366f1' }]} />
                                <Text style={styles.chartTitle}>INTERACTION ANALYTICS</Text>
                            </View>
                            <View style={styles.chartLegends}>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                                    <Text style={styles.legendText}>Collabs</Text>
                                </View>
                                <View style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                                    <Text style={styles.legendText}>AI Queries</Text>
                                </View>
                            </View>
                        </View>

                        {/* Selected Month Tooltip */}
                        {selectedInteractionMonth && (
                            <View style={styles.tooltipBox}>
                                <Text style={styles.tooltipMonth}>{selectedInteractionMonth.name} Activity</Text>
                                <View style={styles.tooltipValues}>
                                    <View style={styles.tooltipItem}>
                                        <Ionicons name="git-pull-request" size={14} color="#6366f1" style={{ marginRight: 6 }} />
                                        <Text style={styles.tooltipText}>Collabs: <Text style={{ color: '#6366f1', fontWeight: 'black' }}>{selectedInteractionMonth.collaborations}</Text></Text>
                                    </View>
                                    <View style={styles.tooltipItem}>
                                        <Ionicons name="sparkles" size={14} color="#f97316" style={{ marginRight: 6 }} />
                                        <Text style={styles.tooltipText}>AI Queries: <Text style={{ color: '#f97316', fontWeight: 'black' }}>{selectedInteractionMonth.history}</Text></Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* SVG Line Chart */}
                        {chartData.length > 0 ? (
                            <View style={styles.chartCanvasContainer}>
                                <Svg width={svgWidth} height={svgHeight}>
                                    {/* Grid Lines */}
                                    {getTicks(maxInteractionVal).map((tick, idx) => {
                                        const tickY = getY(tick, maxInteractionVal);
                                        return (
                                            <G key={idx}>
                                                <Line 
                                                    x1={paddingLeft} 
                                                    y1={tickY} 
                                                    x2={svgWidth - paddingRight} 
                                                    y2={tickY} 
                                                    stroke="rgba(255,255,255,0.03)" 
                                                    strokeDasharray="3 3" 
                                                />
                                                <SvgText
                                                    x={paddingLeft - 8}
                                                    y={tickY + 3}
                                                    fill="rgba(255,255,255,0.2)"
                                                    fontSize={9}
                                                    fontWeight="900"
                                                    textAnchor="end"
                                                >
                                                    {tick}
                                                </SvgText>
                                            </G>
                                        );
                                    })}

                                    {/* X-Axis labels */}
                                    {chartData.map((d, i) => (
                                        <SvgText
                                            key={i}
                                            x={getX(i)}
                                            y={svgHeight - 6}
                                            fill="rgba(255,255,255,0.2)"
                                            fontSize={9}
                                            fontWeight="900"
                                            textAnchor="middle"
                                        >
                                            {d.name}
                                        </SvgText>
                                    ))}

                                    {/* Highlight active vertical line */}
                                    {selectedInteractionMonth && (() => {
                                        const idx = chartData.findIndex(d => d.name === selectedInteractionMonth.name);
                                        if (idx !== -1) {
                                            const selX = getX(idx);
                                            return (
                                                <Line 
                                                    x1={selX} 
                                                    y1={paddingTop} 
                                                    x2={selX} 
                                                    y2={paddingTop + graphHeight} 
                                                    stroke="rgba(255,255,255,0.15)" 
                                                    strokeDasharray="4 4" 
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Curved lines */}
                                    <Path
                                        d={getBezierPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.collaborations, maxInteractionVal) })))}
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                    />
                                    <Path
                                        d={getBezierPath(chartData.map((d, i) => ({ x: getX(i), y: getY(d.history, maxInteractionVal) })))}
                                        fill="none"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                    />

                                    {/* Data dots on path */}
                                    {chartData.map((d, i) => {
                                        const x = getX(i);
                                        const yCollab = getY(d.collaborations, maxInteractionVal);
                                        const yHistory = getY(d.history, maxInteractionVal);
                                        return (
                                            <G key={i}>
                                                <Circle cx={x} cy={yCollab} r={4} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />
                                                <Circle cx={x} cy={yHistory} r={4} fill="#f97316" stroke="#fff" strokeWidth={1.5} />
                                            </G>
                                        );
                                    })}

                                    {/* Selected active dots highlight */}
                                    {selectedInteractionMonth && (() => {
                                        const idx = chartData.findIndex(d => d.name === selectedInteractionMonth.name);
                                        if (idx !== -1) {
                                            const selX = getX(idx);
                                            const yCollab = getY(selectedInteractionMonth.collaborations, maxInteractionVal);
                                            const yHistory = getY(selectedInteractionMonth.history, maxInteractionVal);
                                            return (
                                                <G>
                                                    <Circle cx={selX} cy={yCollab} r={6} fill="#6366f1" stroke="#fff" strokeWidth={2} />
                                                    <Circle cx={selX} cy={yHistory} r={6} fill="#f97316" stroke="#fff" strokeWidth={2} />
                                                </G>
                                            );
                                        }
                                        return null;
                                    })()}
                                </Svg>

                                {/* Absolute Interactive Overlay Strips */}
                                <View style={[styles.chartOverlay, { left: paddingLeft, width: graphWidth, height: graphHeight, top: paddingTop }]}>
                                    {chartData.map((month, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.overlayStrip}
                                            activeOpacity={1}
                                            onPress={() => setSelectedInteractionMonth(month)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.chartEmpty}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        )}
                    </View>

                    {/* Recent Activity List */}
                    <View style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                            <Text style={styles.activityHeaderTitle}>RECENT ACTIVITY</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ManageTheses', { status: 'all' })}>
                                <Text style={styles.viewAllText}>VIEW ALL</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.activityList}>
                            {recentActivity.length > 0 ? (
                                recentActivity.map((thesis) => (
                                    <TouchableOpacity 
                                        key={thesis._id} 
                                        style={styles.activityItem}
                                        onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesis._id })}
                                    >
                                        <View style={styles.activityIcon}>
                                            <Ionicons name="document" size={16} color="rgba(255, 255, 255, 0.4)" />
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={styles.activityItemTitle} numberOfLines={1}>{thesis.title}</Text>
                                            <View style={styles.activityItemSubRow}>
                                                <View style={[styles.statusBadge, thesis.isApproved ? styles.approvedBadge : styles.pendingBadge]}>
                                                    <Text style={[styles.statusText, thesis.isApproved ? styles.approvedText : styles.pendingText]}>
                                                        {thesis.isApproved ? 'Approved' : 'Pending'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.activityDate}>
                                                    {new Date(thesis.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="folder-open-outline" size={24} color={Colors.textDim} />
                                    <Text style={styles.emptyText}>No recent activity found</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Bottom Nav Bar */}
            <BottomNavBar activeScreen="AdminDashboard" onGridPress={() => setIsMenuVisible(true)} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', marginTop: 16, letterSpacing: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 110, paddingHorizontal: 20 },

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerBar: { width: 4, height: 40, borderRadius: 2, backgroundColor: Colors.primary },
    headerTag: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 2 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase' },
    adminBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: `${Colors.primary}15`, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: `${Colors.primary}30` 
    },
    adminBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statsCard: { 
        width: (width - 52) / 2, 
        backgroundColor: Colors.card, 
        borderRadius: 20, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.border,
        justifyContent: 'center',
    },
    iconCircle: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statVal: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
    statLbl: { fontSize: 9, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1 },

    // Chart Base Card
    chartCard: { 
        backgroundColor: Colors.card, 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        marginBottom: 16 
    },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    titleBar: { width: 3, height: 14, borderRadius: 1.5 },
    chartTitle: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    chartLegends: { flexDirection: 'row', gap: 12 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 9, fontWeight: 'bold', color: Colors.textSecondary },

    // Donut chart styles
    donutContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 10 },
    donutLegends: { flex: 1, gap: 12, marginLeft: 10 },
    donutLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    donutLegendTextContainer: { flex: 1 },
    legendValue: { fontSize: 14, fontWeight: '900', color: '#fff', marginTop: 2 },

    // Tooltip elements
    tooltipBox: { 
        backgroundColor: 'rgba(255,255,255,0.02)', 
        borderWidth: 1, 
        borderColor: Colors.border, 
        borderRadius: 14, 
        padding: 10, 
        marginBottom: 16 
    },
    tooltipMonth: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    tooltipValues: { flexDirection: 'row', justifyContent: 'space-between' },
    tooltipItem: { flexDirection: 'row', alignItems: 'center' },
    tooltipText: { fontSize: 11, color: '#fff' },

    // Notice Warning card styling
    noticeBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        gap: 12,
        alignItems: 'flex-start',
    },
    noticeText: {
        flex: 1,
        fontSize: 12,
        color: '#fbbf24',
        lineHeight: 18,
        fontWeight: '500',
    },

    // SVG Drawing helpers
    chartCanvasContainer: { position: 'relative' },
    chartOverlay: { position: 'absolute', flexDirection: 'row' },
    overlayStrip: { flex: 1, height: '100%' },
    chartEmpty: { height: 200, justifyContent: 'center', alignItems: 'center' },

    // Recent Activity Cards
    activityCard: { 
        backgroundColor: Colors.card, 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.border,
        marginBottom: 16
    },
    activityHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.05)', 
        paddingBottom: 12 
    },
    activityHeaderTitle: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    viewAllText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    activityList: { gap: 12 },
    activityItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.02)' 
    },
    activityIcon: { 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginRight: 12,
        borderWidth: 1,
        borderColor: Colors.border
    },
    activityContent: { flex: 1 },
    activityItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    activityItemSubRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    approvedBadge: { backgroundColor: 'rgba(34,197,94,0.1)' },
    pendingBadge: { backgroundColor: 'rgba(251,191,36,0.1)' },
    statusText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
    approvedText: { color: '#4ade80' },
    pendingText: { color: '#fbbf24' },
    activityDate: { fontSize: 10, color: Colors.textDim },
    emptyState: { paddingVertical: 24, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 12, color: Colors.textDim, fontWeight: 'bold' }
});

export default AdminDashboard;
