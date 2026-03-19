import { ref } from 'vue';

export const isDialogVisible = ref(false);
export const dialogQuestion = ref('');

let resolvePromise: ((value: boolean) => void) | null = null;

export const showDialog = (question: string): Promise<boolean> => {
    if (isDialogVisible.value) {
        return Promise.resolve(false);
    }
    
    dialogQuestion.value = question;
    isDialogVisible.value = true;
    
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
};

export const respondDialog = (answer: boolean) => {
    if (resolvePromise) {
        resolvePromise(answer);
        resolvePromise = null;
    }
    isDialogVisible.value = false;
};