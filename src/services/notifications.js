import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
        lightColor: '#4a90e2'
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
      trigger: null
    });
  } catch {}
};

export const notifyNewMessage = async (fromUser, text) => {
  await notify('New message', `${fromUser || 'Someone'}: ${text}`);
};

export const notifyStoryPosted = async () => {
  await notify('Story posted', 'Your story has been shared.');
};
// Cross-app notifications helper using expo-notifications
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

export async function requestNotificationPermissions() {
	try {
		const settings = await Notifications.getPermissionsAsync();
		let finalStatus = settings.status;
		if (finalStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		// Android channel
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.DEFAULT,
			});
		}
		return finalStatus === 'granted';
	} catch (e) {
		return false;
	}
}

export async function notifyNewMessage({ fromUsername, text }) {
	try {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: `${fromUsername || 'New message'}`,
				body: text?.slice(0, 100) || 'You have a new message',
				sound: undefined,
			},
			trigger: null,
		});
	} catch {}
}

export async function notifyNewStory({ author, title }) {
	try {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: `${author || 'New story'}`,
				body: title?.slice(0, 100) || 'A new story was posted',
				sound: undefined,
			},
			trigger: null,
		});
	} catch {}
}

export default {
	requestNotificationPermissions,
	notifyNewMessage,
	notifyNewStory,
};
