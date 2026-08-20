import React, { useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { ReportBreakdownScreen, BreakdownSubmission } from './ReportBreakdownScreen';
import { useCreateBreakdownReport, useUploadMedia } from '../../hooks/useBreakdown';
import { useVehicle } from '../../hooks/useVehicles';
import { usePace } from '../../hooks/useMileage';

interface ReportBreakdownContainerProps {
  vehicleId: string;
  onAnalyzed: (reportId: string) => void;
  onBack?: () => void;
}

export function ReportBreakdownContainer({ vehicleId, onAnalyzed, onBack }: ReportBreakdownContainerProps) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: pace } = usePace(vehicleId);
  const uploadMedia = useUploadMedia();
  const createReport = useCreateBreakdownReport();

  const photoUri = useRef<string | null>(null);
  const videoUri = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioUri = useRef<string | null>(null);

  return (
    <ReportBreakdownScreen
      onBack={onBack}
      vehicleLabel={vehicle ? `${vehicle.make} ${vehicle.model}` : ''}
      odometerKm={pace?.currentKm ?? 0}
      onCapturePhoto={async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return false;
        const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
        if (result.canceled || !result.assets?.[0]) return false;
        photoUri.current = result.assets[0].uri;
        return true;
      }}
      onCaptureVideo={async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return false;
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['videos'],
          videoMaxDuration: 30,
        });
        if (result.canceled || !result.assets?.[0]) return false;
        videoUri.current = result.assets[0].uri;
        return true;
      }}
      onCaptureAudio={async () => {
        try {
          if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
            audioUri.current = recordingRef.current.getURI();
            recordingRef.current = null;
            return true;
          }
          const permission = await Audio.requestPermissionsAsync();
          if (!permission.granted) return false;
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY,
          );
          recordingRef.current = recording;
          return true;
        } catch {
          return false;
        }
      }}
      onAnalyze={async (submission: BreakdownSubmission) => {
        try {
          const attachments: { type: 'photo' | 'video' | 'audio'; url: string }[] = [];

          if (submission.hasPhoto && photoUri.current) {
            const uploaded = await uploadMedia.mutateAsync({
              uri: photoUri.current,
              name: 'photo.jpg',
              type: 'image/jpeg',
            });
            attachments.push({ type: 'photo', url: uploaded.url });
          }
          if (submission.hasVideo && videoUri.current) {
            const uploaded = await uploadMedia.mutateAsync({
              uri: videoUri.current,
              name: 'video.mp4',
              type: 'video/mp4',
            });
            attachments.push({ type: 'video', url: uploaded.url });
          }
          if (submission.hasAudio && audioUri.current) {
            const uploaded = await uploadMedia.mutateAsync({
              uri: audioUri.current,
              name: 'audio.m4a',
              type: 'audio/m4a',
            });
            attachments.push({ type: 'audio', url: uploaded.url });
          }

          const report = await createReport.mutateAsync({
            vehicleId,
            descriptionText: submission.descriptionText,
            tags: submission.tags,
            urgent: submission.tags.includes('urgent'),
            attachments,
          });
          onAnalyzed(report.id);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
