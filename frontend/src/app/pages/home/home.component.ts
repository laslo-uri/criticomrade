import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MovieService } from 'src/app/services/open-movie-database.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  movies: any[] = [];
  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.movieService.getPopularMovies().subscribe(
      (data: any) => {
        this.movies = data.results;
      },
      (error) => {
        console.error('Error fetching movie data:', error);
      }
    );
  }

  getBackdropPath(backdropPath: string): string {
    return `https://image.tmdb.org/t/p/w500${backdropPath}`;
  }

  scrollCarousel(direction: number): void {
    const container: HTMLElement = this.carouselContainer.nativeElement;
    const slideWidth = container.clientWidth / 3; // Width of a single slide (3 movies)
    const distanceToScroll = slideWidth * direction;
    const currentPosition = container.scrollLeft;
    const remainder = currentPosition % slideWidth;

    let scrollToPosition = currentPosition + distanceToScroll;
    if (remainder !== 0) {
      // If not on a full slide, adjust scroll position to start of the nearest full slide
      if (direction > 0) {
        scrollToPosition += slideWidth - remainder;
      } else {
        scrollToPosition -= remainder;
      }
    }

    container.scrollTo({
      left: scrollToPosition,
      behavior: 'smooth',
    });
  }

  isAtBeginning(): boolean {
    const container: HTMLElement | null = this.carouselContainer?.nativeElement;
    return container ? container.scrollLeft === 0 : true;
  }

  isAtEnd(): boolean {
    const container: HTMLElement | null = this.carouselContainer?.nativeElement;
    return container
      ? container.scrollLeft + container.clientWidth >= container.scrollWidth
      : true;
  }
}
