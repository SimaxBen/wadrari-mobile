import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Foreground behavior: show alerts without sound/badge by default
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

export const configureNotifications = async () => {
	try {
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;
		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		if (finalStatus !== 'granted') return false;
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.DEFAULT,
				lightColor: '#4a90e2',
			});
		}
		return true;
	} catch {
		return false;
	}
};

export const notify = async (title, body) => {
	try {
		await Notifications.scheduleNotificationAsync({
			content: { title, body },
			trigger: null,
		});
	} catch {}
};

// API used in App.js
export const notifyNewMessage = async (fromUser, text) => {
	await notify('New message', `${fromUser || 'Someone'}: ${text}`);
};

export const notifyStoryPosted = async () => {
	await notify('Story posted', 'Your story has been shared.');
};

// Optional helpers
export const requestNotificationPermissions = configureNotifications;
export const notifyNewStory = async ({ author, title }) => {
	await notify(author || 'New story', title?.slice(0, 100) || 'A new story was posted');
};

export default {
	requestNotificationPermissions,
	notifyNewMessage,
	notifyNewStory,
};
