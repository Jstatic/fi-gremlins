import nerdAlertImg from './images/nerdalert';
import ratImg from './images/ratthew';
import menImg from './images/men';

export const makeRandom = () => {
    return (Math.random() * 3 - 1);
}

export const makeRandomPos = () => {
    return (Math.random() * 2);
}

export function getRandomAlphanumeric(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIndex = Math.floor(Math.random() * chars.length);
    return chars[randomIndex];
}

export function clone(val: any) {
    return JSON.parse(JSON.stringify(val))
}
  
export function randomImage() {
    const images = [nerdAlertImg, ratImg, menImg];
    return images[Math.floor(Math.random() * images.length)];
}

export function detach(instance: InstanceNode) {
    if (instance.children) {
        instance.children.forEach(child => {
            if (child.type === "INSTANCE") return detach(child);
        })
    }
    // Always check node.removed, otherwise it will cause memory/concurrency issues
    if (!instance.removed) instance.detachInstance();
}