import React from 'react';
import { StyleSheet, TextInput, ScrollView, Alert, Button, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import SessionScreen from './session';
import ChatScreen from './chat';

interface HealthData {
  heartRate: string;
  sleepHours: string;
  snoringRate: string;
  timestamp: string;
  stressLevel?: string;
  prediction?: number;
  confidence?: number;
}

const screenWidth = Dimensions.get('window').width;

export default function TabOneScreen() {
  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: '',
    sleepHours: '',
    snoringRate: '',
    timestamp: '',
  });

  const [savedData, setSavedData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const predictStress = async (data: HealthData) => {
    try {
      const response = await fetch('http://192.168.204.181:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heart_rate: parseFloat(data.heartRate),
          sleep_hours: parseFloat(data.sleepHours),
          snoring_rate: parseFloat(data.snoringRate),
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to get prediction');
      }

      return result;
    } catch (error) {
      console.error('Error predicting stress:', error);
      throw error;
    }
  };

  const saveData = async () => {
    if (!healthData.heartRate || !healthData.sleepHours || !healthData.snoringRate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Try multiple IP addresses to ensure connectivity
      const endpoints = [
        'http://192.168.204.181:5000/predict',
        'http://10.0.2.2:5000/predict',  // Android emulator localhost
        'http://localhost:5000/predict',  // iOS simulator localhost
      ];

      let response = null;
      let error = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              heart_rate: parseFloat(healthData.heartRate),
              sleep_hours: parseFloat(healthData.sleepHours),
              snoring_rate: parseFloat(healthData.snoringRate),
            }),
          });
          if (response.ok) break;
        } catch (e) {
          error = e;
          console.log(`Failed to connect to ${endpoint}:`, e);
          continue;
        }
      }

      if (!response) {
        throw new Error('Could not connect to any server endpoint. Please check if the backend server is running.');
      }

      const data = await response.json();
      
      if (response.ok) {
        const newData = {
          ...healthData,
          timestamp: new Date().toISOString(),
          stressLevel: data.stress_level,
          confidence: data.confidence,
        };
        
        const updatedData = [...savedData, newData];
        await AsyncStorage.setItem('healthData', JSON.stringify(updatedData));
        setSavedData(updatedData);
        setHealthData({ heartRate: '', sleepHours: '', snoringRate: '', timestamp: '' });
        Alert.alert('Success', 'Data saved successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to the server. Please ensure:\n\n' +
        '1. The backend server is running\n' +
        '2. You are connected to the correct network\n' +
        '3. The server IP address is correct'
      );
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
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      rotation: 45,
      fontSize: 12,
      textAnchor: 'start' as const
    }
  };

  const renderCharts = () => {
    if (savedData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available yet. Start by adding your health metrics!</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.chartsContainer}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Snoring Rate Trend</Text>
          <BarChart
            data={getChartData('snoringRate')}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=" %"
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep Hours Trend</Text>
          <BarChart
            data={getChartData('sleepHours')}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=" hrs"
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Heart Rate Trend</Text>
          <LineChart
            data={getChartData('heartRate')}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={true}
          />
        </View>

        <View style={styles.stressSummary}>
          <Text style={styles.stressTitle}>Stress Level Summary</Text>
          {savedData.slice(-5).reverse().map((data, index) => (
            <View key={index} style={styles.stressItem}>
              <Text style={styles.stressDate}>
                {new Date(data.timestamp).toLocaleDateString()}
              </Text>
              <Text style={data.stressLevel === "Stressed" ? styles.stressedText : styles.notStressedText}>
                {data.stressLevel}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {(data.confidence! * 100).toFixed(1)}%
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

  return (
    <View style={styles.container}>
      <View style={styles.calmifyContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, styles.activeTab]}
            onPress={() => {}}
          >
            <Ionicons name="fitness-outline" size={24} color="#007AFF" />
            <Text style={[styles.tabText, styles.activeNavText]}>Input Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab]}
            onPress={() => {}}
          >
            <Ionicons name="analytics-outline" size={24} color="#666" />
            <Text style={styles.tabText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {!showAnalytics ? (
          <ScrollView style={styles.inputContainer}>
            <View style={styles.inputCard}>
              <Text style={styles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.input}
                value={healthData.heartRate}
                onChangeText={(text) => setHealthData({ ...healthData, heartRate: text })}
                keyboardType="numeric"
                placeholder="Enter heart rate"
              />

              <Text style={styles.label}>Sleep Hours</Text>
              <TextInput
                style={styles.input}
                value={healthData.sleepHours}
                onChangeText={(text) => setHealthData({ ...healthData, sleepHours: text })}
                keyboardType="numeric"
                placeholder="Enter sleep hours"
              />

              <Text style={styles.label}>Snoring Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={healthData.snoringRate}
                onChangeText={(text) => setHealthData({ ...healthData, snoringRate: text })}
                keyboardType="numeric"
                placeholder="Enter snoring rate percentage"
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
              <Text style={styles.recentTitle}>Recent Entries</Text>
              {savedData.slice(-5).reverse().map((data, index) => (
                <View key={index} style={styles.entryCard}>
                  <Text style={styles.entryDate}>
                    {new Date(data.timestamp).toLocaleDateString()}
                  </Text>
                  <View style={styles.entryDetails}>
                    <Text style={styles.entryText}>Heart Rate: {data.heartRate} bpm</Text>
                    <Text style={styles.entryText}>Sleep: {data.sleepHours} hours</Text>
                    <Text style={styles.entryText}>Snoring Rate: {data.snoringRate}%</Text>
                    {data.stressLevel && (
                      <Text style={data.stressLevel === "Stressed" ? styles.stressedText : styles.notStressedText}>
                        Stress Level: {data.stressLevel}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.chartsContainer}>
            {savedData.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No data available yet. Start by adding your health metrics!</Text>
              </View>
            ) : (
              <>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Snoring Rate Trend</Text>
                  <LineChart
                    data={{
                      labels: savedData.slice(-7).map(data => 
                        new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
                      ),
                      datasets: [{
                        data: savedData.slice(-7).map(data => parseFloat(data.snoringRate))
                      }]
                    }}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    fromZero
                    segments={5}
                  />
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Sleep Hours Trend</Text>
                  <BarChart
                    data={{
                      labels: savedData.slice(-7).map(data => 
                        new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
                      ),
                      datasets: [{
                        data: savedData.slice(-7).map(data => parseFloat(data.sleepHours))
                      }]
                    }}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    fromZero
                    yAxisLabel=""
                    yAxisSuffix="hrs"
                  />
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Heart Rate Trend</Text>
                  <LineChart
                    data={{
                      labels: savedData.slice(-7).map(data => 
                        new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
                      ),
                      datasets: [{
                        data: savedData.slice(-7).map(data => parseFloat(data.heartRate))
                      }]
                    }}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    fromZero
                    segments={8}
                  />
                </View>
              </>
            )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calmifyContainer: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  chartsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff3b30',
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
    backgroundColor: '#fff',
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#fff',
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
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ffffff',
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryDate: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 8,
    fontWeight: '500',
  },
  entryDetails: {
    gap: 6,
  },
  entryText: {
    fontSize: 16,
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  stressSummary: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  stressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stressDate: {
    fontSize: 14,
    color: '#666',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  stressedText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  notStressedText: {
    color: '#4cd964',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

