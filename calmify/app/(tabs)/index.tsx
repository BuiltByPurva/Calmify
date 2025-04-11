import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, Alert, Button, Dimensions, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import SessionScreen from './session';
import ChatScreen from './chat';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColor } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

interface HealthData {
  snoringRange: string;
  respirationRate: string;
  bodyTemperature: string;
  bloodOxygen: string;
  sleepHours: string;
  heartRate: string;
  timestamp: string;
  stressLevel?: number;
  stressLabel?: string;
  prediction?: number;
}

const screenWidth = Dimensions.get('window').width;

const STRESS_LABELS = {
  0: "No Stress",
  1: "Mild Stress",
  2: "Moderate Stress",
  3: "High Stress",
  4: "Extreme Stress"
};

const getStressLabel = (level: number): string => {
  return STRESS_LABELS[level as keyof typeof STRESS_LABELS] || "Unknown";
};

const getStressLevelColor = (level: number) => {
  switch (level) {
    case 0: return '#4CD964';  // No Stress - Green
    case 1: return '#5856D6';  // Low Stress - Purple
    case 2: return '#FF9500';  // Moderate Stress - Orange
    case 3: return '#FF3B30';  // High Stress - Red
    case 4: return '#FF2D55';  // Extreme Stress - Pink
    default: return '#8E8E93'; // Grey for unknown
  }
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const chartBackground = useThemeColor({}, 'chartBackground');
  const legendText = useThemeColor({}, 'legendText');
  const pieChartBackground = useThemeColor({}, 'pieChartBackground');
  const stressLevelBorder = useThemeColor({}, 'stressLevelBorder');
  const stressLevelBackground = useThemeColor({}, 'stressLevelBackground');
  const deleteButton = useThemeColor({}, 'deleteButton');
  const tabBarBorder = useThemeColor({}, 'tabBarBorder');
  const entryCardBackground = useThemeColor({}, 'entryCardBackground');
  const entryDateText = useThemeColor({}, 'entryDateText');
  const entryText = useThemeColor({}, 'entryText');
  const emptyStateText = useThemeColor({}, 'emptyStateText');
  const placeholderTextColor = colorScheme === 'dark' ? '#666666' : '#999999';

  const [activeTab, setActiveTab] = useState<'input' | 'charts'>('input');
  const [healthData, setHealthData] = useState<HealthData>({
    snoringRange: '',
    respirationRate: '',
    bodyTemperature: '',
    bloodOxygen: '',
    sleepHours: '',
    heartRate: '',
    timestamp: '',
  });

  const [savedData, setSavedData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const data = await AsyncStorage.getItem('healthData');
      if (data) {
        setSavedData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  
  const saveData = async () => {
    if (!healthData.snoringRange || !healthData.respirationRate || 
        !healthData.bodyTemperature || !healthData.bloodOxygen || 
        !healthData.sleepHours || !healthData.heartRate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending data to backend:', {
        snoringRange: parseFloat(healthData.snoringRange),
        respirationRate: parseFloat(healthData.respirationRate),
        bodyTemperature: parseFloat(healthData.bodyTemperature),
        bloodOxygen: parseFloat(healthData.bloodOxygen),
        sleepHours: parseFloat(healthData.sleepHours),
        heartRate: parseFloat(healthData.heartRate),
      });

      const response = await fetch('http://192.168.204.181:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snoringRange: parseFloat(healthData.snoringRange),
          respirationRate: parseFloat(healthData.respirationRate),
          bodyTemperature: parseFloat(healthData.bodyTemperature),
          bloodOxygen: parseFloat(healthData.bloodOxygen),
          sleepHours: parseFloat(healthData.sleepHours),
          heartRate: parseFloat(healthData.heartRate),
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        const newData = {
          ...healthData,
          timestamp: new Date().toISOString(),
          stressLevel: data.stress_level,
          stressLabel: data.stress_label,
          prediction: data.prediction
        };
        
        const updatedData = [...savedData, newData];
        await AsyncStorage.setItem('healthData', JSON.stringify(updatedData));
        setSavedData(updatedData);
        setHealthData({
          snoringRange: '',
          respirationRate: '',
          bodyTemperature: '',
          bloodOxygen: '',
          sleepHours: '',
          heartRate: '',
          timestamp: '',
        });
        Alert.alert('Success', 'Data saved successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = (key: keyof HealthData) => {
    const recentData = savedData.slice(-7).reverse();
    return {
      labels: recentData.map(d => new Date(d.timestamp).toLocaleDateString()),
      datasets: [{
        data: recentData.map(d => parseFloat(d[key] as string))
      }]
    };
  };

  const chartConfig = {
    backgroundColor: chartBackground,
    backgroundGradientFrom: chartBackground,
    backgroundGradientTo: chartBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.9,
    propsForLabels: {
      fontSize: 11,
      rotation: 0,
      textAnchor: 'middle' as const,
      fill: textColor,
    },
    propsForVerticalLabels: {
      fontSize: 11,
      rotation: 0,
      textAnchor: 'middle' as const,
      fill: textColor,
    },
  };

  const renderCharts = () => {
    if (savedData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available yet. Start by adding your health metrics!</Text>
        </View>
      );
    }

    // Get the latest sleep hours data
    const latestSleepHours = parseFloat(savedData[savedData.length - 1].sleepHours);
    const sleepQuality = latestSleepHours >= 6 && latestSleepHours <= 7 ? 'Optimal' : 
                        latestSleepHours < 6 ? 'Insufficient' : 'Excessive';
    
    // Calculate sleep distribution for pie chart
    const sleepData = [
      {
        name: 'Optimal (6-7 hrs)',
        population: latestSleepHours >= 6 && latestSleepHours <= 7 ? 1 : 0,
        color: '#4CAF50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Insufficient (<6 hrs)',
        population: latestSleepHours < 6 ? 1 : 0,
        color: '#FFC107',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Excessive (>7 hrs)',
        population: latestSleepHours > 7 ? 1 : 0,
        color: '#FF5722',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ];

    return (
      <ScrollView style={styles.chartsContainer}>
        <View style={styles.dashboardHeader}>
          <Text style={[styles.dashboardTitle, { color: textColor }]}>Health Analytics</Text>
          <Text style={[styles.dashboardSubtitle, { color: colorScheme === 'dark' ? '#8E8E93' : '#666666' }]}>
            Your health metrics overview
          </Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.chartTitle, { color: textColor }]}>Sleep Quality Analysis</Text>
              
            </View>
            <View style={[styles.qualityBadge, { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(0, 122, 255, 0.1)',
              borderColor: colorScheme === 'dark' ? '#4A90E2' : '#007AFF',
              marginLeft: 12,
            }]}>
              <Text style={[styles.qualityText, { color: colorScheme === 'dark' ? '#4A90E2' : '#007AFF' }]}>
                {sleepQuality}
              </Text>
            </View>
          </View>
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChartContent}>
              <View style={styles.pieChartSection}>
              <PieChart
    data={sleepData}
    width={160}
    height={160}
    chartConfig={{
      ...chartConfig,
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    }}
    accessor="population"
    backgroundColor="transparent"
    paddingLeft="15"
    absolute
    hasLegend={false}
    center={[0, 0]}
  />
              </View>
              <View style={styles.legendSection}>
                {sleepData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: colorScheme === 'dark' ? '#E0E0E0' : '#666666' }]}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.chartTitle, { color: textColor }]}>Heart Rate Trend</Text>
             
            </View>
            <View style={[styles.statBadge, { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255, 59, 48, 0.1)',
              borderColor: colorScheme === 'dark' ? '#FF453A' : '#FF3B30',
              marginLeft: 12,
            }]}>
              <Text style={[styles.statText, { color: colorScheme === 'dark' ? '#FF453A' : '#FF3B30' }]}>
                {savedData.length > 0 ? `${savedData[savedData.length - 1].heartRate} bpm` : 'N/A'}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={getChartData('heartRate')}
              width={Math.max(screenWidth - 32, savedData.length * 100)}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 69, 58, ${opacity})` : `rgba(255, 59, 48, ${opacity})`,
              }}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=" bpm"
              fromZero
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              segments={4}
            />
          </ScrollView>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.chartTitle, { color: textColor }]}>Stress Level Trend</Text>
              
            </View>
            {savedData.length > 0 && savedData[savedData.length - 1].prediction !== undefined && (
              <View style={[styles.stressLevelBadge, { 
                backgroundColor: colorScheme === 'dark' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                borderColor: colorScheme === 'dark' ? '#4A90E2' : '#007AFF',
                marginLeft: 12,
              }]}>
                <Text style={[styles.stressLevelText, { color: colorScheme === 'dark' ? '#4A90E2' : '#007AFF' }]}>
                  Level {savedData[savedData.length - 1].prediction?.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: savedData.slice(-7).map(d => new Date(d.timestamp).toLocaleDateString()),
                datasets: [{
                  data: savedData.slice(-7).map(d => d.prediction || 0)
                }]
              }}
              width={Math.max(screenWidth - 32, savedData.length * 100)}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => colorScheme === 'dark' ? `rgba(74, 144, 226, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
              }}
              style={styles.chart}
              bezier
              withDots
              withShadow
              withInnerLines
              withOuterLines
              withVerticalLines
              withHorizontalLines
              withVerticalLabels
              withHorizontalLabels
              fromZero
            />
          </ScrollView>
        </View>

        <View style={styles.stressSummary}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: textColor }]}>Recent Stress Analysis</Text>
            <Text style={[styles.summarySubtitle, { color: colorScheme === 'dark' ? '#8E8E93' : '#666666' }]}>
              Last 5 measurements
            </Text>
          </View>
          {savedData.slice(-5).reverse().map((data, index) => (
            <View key={index} style={[
              styles.stressItem,
              { 
                backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
                borderLeftColor: getStressLevelColor(data.stressLevel || 0)
              }
            ]}>
              <View style={styles.stressItemContent}>
                <View>
                  <Text style={[styles.stressDate, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                    {new Date(data.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.stressTime, { color: colorScheme === 'dark' ? '#8E8E93' : '#666666' }]}>
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={[styles.stressLevelIndicator, {
                  backgroundColor: colorScheme === 'dark' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                }]}>
                  <Text style={[styles.stressLevelValue, { color: colorScheme === 'dark' ? '#4A90E2' : '#007AFF' }]}>
                    {data.stressLabel || `Level ${data.prediction?.toFixed(1)}`}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all saved data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('healthData');
              setSavedData([]);
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    calmifyContainer: {
      flex: 1,
    },
    inputContainer: {
      flex: 1,
      padding: 20,
      backgroundColor: backgroundColor,
    },
    chartsContainer: {
      flex: 1,
      padding: 0,
      backgroundColor: backgroundColor,
    },
    deleteButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: deleteButton,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: cardBackground,
      paddingBottom: 20,
      paddingTop: 10,
      borderBottomWidth: 1,
      borderBottomColor: tabBarBorder,
      justifyContent: 'space-around',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: stressLevelBorder,
    },
    tabText: {
      fontSize: 12,
      color: entryDateText,
      marginTop: 4,
    },
    activeNavText: {
      color: stressLevelBorder,
      fontWeight: '600',
    },
    inputCard: {
      backgroundColor: cardBackground,
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: textColor,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderColor: inputBorder,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: cardBackground,
      color: textColor,
    },
    button: {
      backgroundColor: stressLevelBorder,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    recentEntries: {
      marginTop: 20,
      backgroundColor: cardBackground,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      position: 'relative',
      overflow: 'hidden',
    },
    cardGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
    },
    recentTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: textColor,
      textAlign: 'center',
    },
    entryCard: {
      marginBottom: 15,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    entryDate: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#fff' : '#000',
      opacity: 0.7,
      fontWeight: '500',
    },
    stressIndicator: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    entryContent: {
      gap: 12,
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    entryItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    entryText: {
      fontSize: 15,
      color: colorScheme === 'dark' ? '#fff' : '#000',
      opacity: 0.9,
      flex: 1,
    },
    stressedText: {
      color: colorScheme === 'dark' ? '#ff6b6b' : '#ff3b30',
      fontWeight: 'bold',
    },
    notStressedText: {
      color: colorScheme === 'dark' ? '#4cd964' : '#34c759',
      fontWeight: 'bold',
    },
    chartCard: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 8,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      width: screenWidth - 16,
      alignSelf: 'center',
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      backgroundColor: 'transparent',
    },
    headerContent: {
      flex: 1,
      paddingRight: 8,
      backgroundColor: 'transparent',
    },
    chartTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      backgroundColor: 'transparent',
    },
    chartDescription: {
      fontSize: 14,
      opacity: 0.7,
    },
    qualityBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
    },
    qualityText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
    },
    statText: {
      fontSize: 12,
      fontWeight: '600',
    },
    stressLevelBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
    },
    stressLevelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    stressSummary: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 8,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      width: screenWidth - 16,
      alignSelf: 'center',
    },
    summaryHeader: {
      marginBottom: 16,
      backgroundColor: 'transparent',
    },
    summaryTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      backgroundColor: 'transparent',
    },
    summarySubtitle: {
      fontSize: 14,
      opacity: 0.7,
    },
    stressItem: {
      borderLeftWidth: 4,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    stressItemContent: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stressDate: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    stressTime: {
      fontSize: 12,
    },
    stressLevelIndicator: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    stressLevelValue: {
      fontSize: 12,
      fontWeight: '600',
    },
    pieChartContainer: {
      borderRadius: 16,
      padding: 0,
      marginTop: 0,
      marginBottom: 10,
      backgroundColor: 'transparent',
      width: '100%',
    },
    pieChartContent: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      width: '100%',
      paddingHorizontal: 8,
    },
    pieChartSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      minHeight: 160,
      width: '50%',
    },
    legendSection: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingLeft: 16,
      width: '50%',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    legendText: {
      fontSize: 12,
    },
    dashboardHeader: {
      padding: 20,
      paddingBottom: 10,
    },
    dashboardTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    dashboardSubtitle: {
      fontSize: 14,
      opacity: 0.7,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyStateText: {
      fontSize: 16,
      color: emptyStateText,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.calmifyContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'input' && styles.activeTab]}
            onPress={() => setActiveTab('input')}
          >
            <Ionicons 
              name="fitness-outline" 
              size={24} 
              color={activeTab === 'input' ? "#007AFF" : "#666"} 
            />
            <Text style={[styles.tabText, activeTab === 'input' && styles.activeNavText]}>
              Input Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
            onPress={() => setActiveTab('charts')}
          >
            <Ionicons 
              name="analytics-outline" 
              size={24} 
              color={activeTab === 'charts' ? "#007AFF" : "#666"} 
            />
            <Text style={[styles.tabText, activeTab === 'charts' && styles.activeNavText]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'input' ? (
          <ScrollView style={styles.inputContainer}>
            <View style={styles.inputCard}>
              <Text style={styles.label}>Snoring Range (%)</Text>
              <TextInput
                style={styles.input}
                value={healthData.snoringRange}
                onChangeText={(text) => setHealthData({ ...healthData, snoringRange: text })}
                keyboardType="numeric"
                placeholder="Enter snoring range percentage"
                placeholderTextColor={placeholderTextColor}
              />

              <Text style={styles.label}>Respiration Rate (breaths/min)</Text>
              <TextInput
                style={styles.input}
                value={healthData.respirationRate}
                onChangeText={(text) => setHealthData({ ...healthData, respirationRate: text })}
                keyboardType="numeric"
                placeholder="Enter respiration rate"
                placeholderTextColor={placeholderTextColor}
              />

              <Text style={styles.label}>Body Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                value={healthData.bodyTemperature}
                onChangeText={(text) => setHealthData({ ...healthData, bodyTemperature: text })}
                keyboardType="numeric"
                placeholder="Enter body temperature"
                placeholderTextColor={placeholderTextColor}
              />

              <Text style={styles.label}>Blood Oxygen Level (%)</Text>
              <TextInput
                style={styles.input}
                value={healthData.bloodOxygen}
                onChangeText={(text) => setHealthData({ ...healthData, bloodOxygen: text })}
                keyboardType="numeric"
                placeholder="Enter blood oxygen level"
                placeholderTextColor={placeholderTextColor}
              />

              <Text style={styles.label}>Sleep Hours</Text>
              <TextInput
                style={styles.input}
                value={healthData.sleepHours}
                onChangeText={(text) => setHealthData({ ...healthData, sleepHours: text })}
                keyboardType="numeric"
                placeholder="Enter sleep hours"
                placeholderTextColor={placeholderTextColor}
              />

              <Text style={styles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                value={healthData.heartRate}
                onChangeText={(text) => setHealthData({ ...healthData, heartRate: text })}
                keyboardType="numeric"
                placeholder="Enter heart rate"
                placeholderTextColor={placeholderTextColor}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={saveData}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Processing..." : "Save Data"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentEntries}>
              <LinearGradient
                colors={[colorScheme === 'dark' ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)', 'transparent']}
                style={styles.cardGradient}
              />
              <Text style={styles.recentTitle}>Recent Entries</Text>
              {savedData.slice(-5).reverse().map((data, index) => (
                <View key={index} style={[
                  styles.entryCard,
                  { borderBottomWidth: index !== savedData.length - 1 ? 1 : 0,
                    borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                ]}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>
                      {new Date(data.timestamp).toLocaleDateString()}
                    </Text>
                    {data.stressLevel !== undefined && (
                      <Text style={[
                        styles.stressIndicator,
                        { backgroundColor: data.stressLevel >= 2 ? 
                          (colorScheme === 'dark' ? '#ff6b6b33' : '#ff3b3033') : 
                          (colorScheme === 'dark' ? '#4cd96433' : '#34c75933') 
                        }
                      ]}>
                        <Text style={data.stressLevel >= 2 ? styles.stressedText : styles.notStressedText}>
                          {getStressLabel(data.stressLevel)}
                        </Text>
                      </Text>
                    )}
                  </View>
                  <View style={styles.entryContent}>
                    <View style={styles.entryRow}>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="bed-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>Sleep: {data.sleepHours}h</Text>
                      </View>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="heart-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>HR: {data.heartRate} bpm</Text>
                      </View>
                    </View>
                    <View style={styles.entryRow}>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="thermometer-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>Temp: {data.bodyTemperature}°C</Text>
                      </View>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="water-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>O2: {data.bloodOxygen}%</Text>
                      </View>
                    </View>
                    <View style={styles.entryRow}>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="pulse-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>Resp: {data.respirationRate}</Text>
                      </View>
                      <View style={styles.entryItem}>
                        <Ionicons 
                          name="volume-high-outline" 
                          size={20} 
                          color={colorScheme === 'dark' ? '#8e8e93' : '#666666'} 
                        />
                        <Text style={styles.entryText}>Snoring: {data.snoringRange}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.chartsContainer}>
            {renderCharts()}
          </ScrollView>
        )}
      </View>

      {savedData.length > 0 && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={clearAllData}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

