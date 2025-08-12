import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenAddress',
  standalone: true,
})
export class ShortenAddressPipe implements PipeTransform {
  transform(address: string | null | undefined): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }
}
