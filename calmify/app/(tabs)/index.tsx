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
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep Quality Analysis</Text>
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChartContent}>
              <View style={styles.pieChartSection}>
                <PieChart
                  data={sleepData}
                  width={120}
                  height={120}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                  hasLegend={false}
                  center={[0, 0]}
                />
              </View>
              <View style={styles.legendSection}>
                {sleepData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.chartSubtitle}>Current Sleep Quality: {sleepQuality}</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Heart Rate Trend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={getChartData('heartRate')}
              width={Math.max(screenWidth - 40, savedData.length * 90)}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
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
          <Text style={styles.chartSubtitle}>Normal Range: 60-100 bpm</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Stress Level Trend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: savedData.slice(-7).map(d => new Date(d.timestamp).toLocaleDateString()),
                datasets: [{
                  data: savedData.slice(-7).map(d => d.prediction || 0)
                }]
              }}
              width={Math.max(screenWidth - 40, savedData.length * 100)}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
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
          <Text style={styles.chartSubtitle}>Stress Level (0-4)</Text>
        </View>

        <View style={styles.stressSummary}>
          <Text style={styles.stressTitle}>Stress Level Summary</Text>
          {savedData.slice(-5).reverse().map((data, index) => (
            <View key={index} style={styles.stressItem}>
              <Text style={styles.stressDate}>
                {new Date(data.timestamp).toLocaleDateString()}
              </Text>
              <Text style={styles.stressLevel}>
                {data.stressLabel || `Level: ${data.prediction?.toFixed(1) || 'N/A'}`}
              </Text>
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
      padding: 10,
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
      backgroundColor: cardBackground,
      borderRadius: 15,
      padding: 10,
      marginBottom: 20,
      marginHorizontal: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: '98%',
      alignSelf: 'center',
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: textColor,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
      marginHorizontal: -10,
    },
    chartSubtitle: {
      fontSize: 12,
      color: entryDateText,
      textAlign: 'center',
      marginTop: 5,
    },
    stressSummary: {
      backgroundColor: cardBackground,
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
      marginHorizontal: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: '98%',
      alignSelf: 'center',
    },
    stressTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: textColor,
      textAlign: 'center',
    },
    stressItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginBottom: 8,
      backgroundColor: stressLevelBackground,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: stressLevelBorder,
    },
    stressDate: {
      fontSize: 14,
      color: entryDateText,
      fontWeight: '500',
    },
    stressLevel: {
      fontSize: 16,
      color: textColor,
      fontWeight: 'bold',
      backgroundColor: pieChartBackground,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
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
    pieChartContainer: {
      backgroundColor: pieChartBackground,
      borderRadius: 16,
      padding: 15,
      marginVertical: 10,
      width: '100%',
      height: 160,
    },
    pieChartContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    pieChartSection: {
      width: '40%',
      alignItems: 'center',
      justifyContent: 'center'
    },
    legendSection: {
      width: '60%',
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 8,
    },
    legendText: {
      color: legendText,
      fontSize: 12,
    },
    sleepQualityText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 10,
      color: textColor,
    },
    sleepRecommendation: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 5,
      color: entryDateText,
      fontStyle: 'italic',
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

