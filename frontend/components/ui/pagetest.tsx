import {Link} from '@inertiajs/react';

export const PaginationTest= (cars:any)=>{
  console.log(cars.cars.links)
    return(
        <div>
     {cars.cars.links.map((link,index) =>(
        <Link
         key={index}
         preserveScroll
         href={link.url || ""}
         dangerouslySetInnerHTML={{__html : link.label}}
        />
      ))}
        </div>
    )
}
