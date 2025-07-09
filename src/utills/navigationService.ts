// NavigationService.ts
import { RootStackParamList } from '@navigation/TypeParamList';
import { CommonActions, createNavigationContainerRef, StackActions } from '@react-navigation/native';


export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}

export function goBack() {
    if (navigationRef.isReady()) {
        navigationRef.goBack();
    }
}

export function replaceAndNavigate<Name extends keyof RootStackParamList>(
    name: Name,
    params?: RootStackParamList[Name]
) {
    if (navigationRef.isReady()) {
        // navigationRef.dispatch(StackActions.replace(name, params));
        navigationRef.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name, params }],
        }));

    }
}

export function resetAndNavigate<Name extends keyof RootStackParamList>(
    name: Name,
    params?: RootStackParamList[Name]
) {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name, params }],
            })
        );
    }
}